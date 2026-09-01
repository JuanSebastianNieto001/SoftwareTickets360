import LoginForm from "@/components/LoginForm";
import HeroLogo from "@/components/HeroLogo";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <div className="voz-hero relative isolate flex min-h-screen flex-col overflow-hidden">
      <div className="voz-dots pointer-events-none absolute inset-0 opacity-30" />

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-6 text-center">
          <HeroLogo size={84} />
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Panel del administrador
          </h1>
          <p className="mt-2 text-sm text-brand-200">Ingresa con tus credenciales de administrador.</p>
        </div>
        <LoginForm next={searchParams.next} />
        <a href="/" className="mt-6 text-center text-sm text-brand-300 hover:underline">
          ← Volver al sitio publico
        </a>
      </main>
    </div>
  );
}
