export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <form
        action="/api/login"
        method="POST"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow"
      >
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Dostęp prywatny
        </h1>

        <p className="mb-6 text-sm text-slate-500">
          Wpisz hasło, żeby wejść do aplikacji.
        </p>

        <input
          type="password"
          name="password"
          placeholder="Hasło"
          className="mb-4 w-full rounded-xl border p-3 text-slate-900"
          required
        />

        <button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white">
          Wejdź
        </button>
      </form>
    </main>
  );
}
