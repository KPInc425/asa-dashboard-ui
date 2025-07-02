const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center">
      <div className="text-center">
        <div className="ark-rotate inline-block mb-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <h2 className="text-2xl font-bold text-primary mb-2">ARK Dashboard</h2>
        <p className="text-base-content/70">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 