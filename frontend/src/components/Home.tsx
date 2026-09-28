import React from 'react';
import Hero from './Hero';
import Marquee from './Marquee';
import HowItWorks from './HowItWorks';
import UrgentRequests from './UrgentRequests';
import DonorPanel from './DonorPanel';
import VolunteerSection from './VolunteerSection';
import FaqSection from './FaqSection';

interface HomeProps {
  isBn: boolean;
  onToast: (msg: string) => void;
}

const Home: React.FC<HomeProps> = ({ isBn, onToast }) => {
  return (
    <main>
      <Hero isBn={isBn} />
      <Marquee />
      <HowItWorks isBn={isBn} />
      <UrgentRequests isBn={isBn} onToast={onToast} />
      <DonorPanel isBn={isBn} onToast={onToast} />
      <VolunteerSection isBn={isBn} />
      <FaqSection isBn={isBn} />
    </main>
  );
};

export default Home;
