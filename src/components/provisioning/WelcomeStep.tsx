import type { FC } from 'react';

const WelcomeStep: FC = () => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-4">🦖</div>
    <h2 className="text-3xl font-bold text-primary">Welcome to ASA Cluster Creation</h2>
    <p className="text-base-content/70 text-lg">
      This wizard will help you create a new ARK: Survival Ascended server cluster.
      Each cluster can contain multiple servers running different maps.
    </p>
    
    <div className="bg-base-300 rounded-lg p-6 max-w-2xl mx-auto">
      <h3 className="font-semibold mb-4">What you'll need:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>SteamCMD installed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>~30GB free disk space per server</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>Stable internet connection</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>Administrator privileges</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>Available network ports</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-success">✅</span>
            <span>10-30 minutes setup time</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default WelcomeStep; 