'use client';

import ChecklistForm from './components/ChecklistForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-center mb-8">Electromechanical Checklist System</h1>
        <ChecklistForm />
      </div>
    </main>
  );
}
