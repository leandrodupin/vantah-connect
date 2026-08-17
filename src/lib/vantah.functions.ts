import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const checkoutSchema = z.object({
  productId: z.string().uuid(),
  origin: z.string().url().max(500),
});

const createClientSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(6).max(72),
  fullName: z.string().min(2).max(120),
  whatsapp: z.string().max(40).optional().default(""),
  isAdmin: z.boolean().optional().default(false),
});

const deleteClientSchema = z.object({ userId: z.string().uuid() });

async function assertAdmin(supabase: {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("Acesso restrito a administradores.");
}

export const createCheckoutPreference = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => checkoutSchema.parse(input))
  .handler(async ({ data, context }) => {
    const token = process.env["MERCADOPAGO_ACCESS_TOKEN"];
    if (!token) throw new Error("Mercado Pago não está configurado.");

    const { supabase, userId } = context;

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, description, price, is_active")
      .eq("id", data.productId)
      .maybeSingle();

    if (productError) throw new Error(productError.message);
    if (!product || !product.is_active) throw new Error("Produto indisponível.");

    const amount = Number(product.price);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ user_id: userId, product_id: product.id, amount, status: "pending" })
      .select("id")
      .single();

    if (orderError) throw new Error(orderError.message);

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: product.id,
            title: product.name,
            description: product.description ?? undefined,
            quantity: 1,
            currency_id: "BRL",
            unit_price: amount,
          },
        ],
        external_reference: order.id,
        back_urls: {
          success: `${data.origin}/dashboard?status=success`,
          pending: `${data.origin}/dashboard?status=pending`,
          failure: `${data.origin}/dashboard?status=failure`,
        },
        auto_return: "approved",
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Mercado Pago error", response.status, detail);
      throw new Error("Não foi possível gerar o checkout do Mercado Pago.");
    }

    const preference = (await response.json()) as {
      id: string;
      init_point?: string;
      sandbox_init_point?: string;
    };

    await supabase
      .from("orders")
      .update({ mercadopago_payment_id: preference.id })
      .eq("id", order.id);

    const initPoint = preference.init_point ?? preference.sandbox_init_point;
    if (!initPoint) throw new Error("Checkout indisponível no momento.");

    return { orderId: order.id as string, initPoint };
  });

export const adminCreateClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createClientSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, whatsapp: data.whatsapp },
    });
    if (error) throw new Error(error.message);
    const newUserId = created.user?.id;
    if (!newUserId) throw new Error("Falha ao criar o cliente.");

    await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.fullName,
        whatsapp: data.whatsapp,
        email: data.email,
        role: data.isAdmin ? "admin" : "client",
      })
      .eq("id", newUserId);

    if (data.isAdmin) {
      await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: "admin" });
    }

    return { id: newUserId };
  });

export const adminDeleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteClientSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    if (data.userId === context.userId) throw new Error("Você não pode excluir a própria conta.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
