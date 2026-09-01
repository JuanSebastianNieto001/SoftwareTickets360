import { IconPeople, IconSend, IconHandHeart, IconHeart } from "@/components/icons";

const ITEMS = [
  { icon: IconPeople, label: "Informacion que conecta" },
  { icon: IconSend, label: "Mensajes que informan" },
  { icon: IconHandHeart, label: "Acciones que ayudan" },
  { icon: IconHeart, label: "Estamos con ustedes", destacado: true },
];

export default function SiteFooter() {
  return (
    <footer className="bg-brand-950">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4 sm:px-6">
        {ITEMS.map(({ icon: Icon, label, destacado }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full border ${
                destacado
                  ? "border-transparent bg-brand-400 text-brand-950"
                  : "border-brand-700 text-brand-200"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <p className="text-xs font-medium text-brand-100">{label}</p>
          </div>
        ))}
      </div>
    </footer>
  );
}
