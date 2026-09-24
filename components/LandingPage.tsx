import React from 'react';
import { Icon } from './Icon';

interface LandingPageProps {
  onStart: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center transform hover:-translate-y-2 transition-transform duration-300">
    <div className="flex justify-center items-center mb-4 text-sky-400">{icon}</div>
    <h3 className="text-xl font-bold text-slate-100 mb-2 font-['Mandali']">{title}</h3>
    <p className="text-slate-400 font-['Mandali']">{description}</p>
  </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-5xl text-center">
        <header className="mb-12">
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold text-sky-400 mb-4 font-['Gurajada']">
            గరుడ
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-400 max-w-3xl mx-auto font-['Mandali']">
            (ఔచిత్యమ్ - పరిశోధన వ్యాస స్వరూపాన్ని ప్రామాణీకరించే సాధనం)
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={<Icon name="sparkles" className="w-10 h-10" />}
            title="పూర్తివ్యాసం ఫార్మాటింగ్"
            description="వ్యాసస్వరూపాన్ని MLA/APA శైలిలో ప్రామాణీకరిస్తుంది."
          />
          <FeatureCard
            icon={<Icon name="document-text" className="w-10 h-10" />}
            title="సారాంశం & కీలకపదాలు"
            description="అకడమిక్ ప్రమాణాలతో వ్యాససంగ్రహం మరియు కీలకపదాలను రూపొందిస్తుంది."
          />
          <FeatureCard
            icon={<Icon name="check-circle" className="w-10 h-10" />}
            title="అనులేఖనాల విశ్లేషణ"
            description="ఉపయుక్తగ్రంథాల జాబితాను MLA లేదా APA శైలిలో క్రమబద్ధీకరిస్తుంది."
          />
        </div>

        <div className="mt-8">
          <button
            onClick={onStart}
            className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-lg py-4 px-10 rounded-lg transition-colors duration-300 flex items-center justify-center gap-3 mx-auto animate-glow-pulse"
          >
            <span className="font-['Mandali']">ప్రారంభించండి</span>
            <Icon name="arrow-right" className="w-6 h-6" />
          </button>
        </div>
      </main>

      <footer className="text-center py-6 text-slate-500 text-sm mt-12">
        <p className="font-['Mandali']">&copy; {new Date().getFullYear()} ఔచిత్యమ్. అంతర్జాల తెలుగు పరిశోధన మాసపత్రిక.</p>
      </footer>
    </div>
  );
};

export default LandingPage;