export default async function Home() {
  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full flex-col py-8 px-6 bg-white dark:bg-black">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-gray-600 mt-2">View and manage all tasks from the system</p>
        </div>
      </main>
    </div>
  );
}
