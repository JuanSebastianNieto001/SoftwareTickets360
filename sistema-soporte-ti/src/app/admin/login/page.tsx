import LoginForm from "@/components/LoginForm";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Panel del administrador</h1>
        <p className="mt-2 text-sm text-slate-600">Ingresa con tus credenciales de administrador.</p>
      </header>
      <LoginForm next={searchParams.next} />
      <a href="/" className="mt-6 text-center text-sm text-slate-500 hover:underline">
        ← Volver al sitio publico
      </a>
    </main>
  );
}
