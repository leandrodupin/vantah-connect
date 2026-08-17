import { Instagram, Linkedin, MessageCircle, QrCode, Link2 } from "lucide-react";

export type CardData = {
  displayName: string;
  jobTitle: string;
  whatsapp: string;
  instagram: string;
  linkedin: string;
  bio: string;
};

export function VirtualCardPreview({ data }: { data: CardData }) {
  const initials = (data.displayName || "VM")
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="card-elevated relative mx-auto w-full max-w-sm overflow-hidden p-6">
      <div className="hero-glow pointer-events-none absolute inset-x-0 -top-16 h-40" />
      <div className="relative flex flex-col items-center text-center">
        <div className="bg-brand flex size-20 items-center justify-center rounded-full text-2xl font-semibold text-primary-foreground">
          {initials}
        </div>
        <h3 className="mt-4 text-xl font-semibold">{data.displayName || "Seu Nome"}</h3>
        <p className="text-sm text-primary">{data.jobTitle || "Seu cargo ou negócio"}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {data.bio || "Uma bio curta que apresenta você e o que você faz."}
        </p>

        <div className="mt-6 w-full space-y-2">
          <CardLink icon={<MessageCircle />} label={data.whatsapp || "WhatsApp"} />
          <CardLink icon={<Instagram />} label={data.instagram || "@instagram"} />
          <CardLink icon={<Linkedin />} label={data.linkedin || "linkedin.com/in/voce"} />
          <CardLink icon={<QrCode />} label="Chave Pix" />
          <CardLink icon={<Link2 />} label="Meus links" />
        </div>
      </div>
    </div>
  );
}

function CardLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm transition-colors hover:border-primary/50 hover:bg-secondary">
      <span className="text-primary [&_svg]:size-4">{icon}</span>
      <span className="truncate text-foreground/90">{label}</span>
    </div>
  );
}
