export default function LoadingPage() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-white"
      role="status" 
      aria-live="polite"
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-gray-900 mx-auto" />
        <span className="sr-only">Загрузка...</span>
      </div>
    </div>
  );
}