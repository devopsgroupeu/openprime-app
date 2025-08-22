import React from 'react';
import WizardContainer from './wizard/WizardContainer';
import ErrorBoundary from '../ErrorBoundary';

const EnvironmentWizard = (props) => {
  // Debug: Log props to understand what we're receiving
  if (process.env.NODE_ENV === 'development') {
    console.log('EnvironmentWizard props:', props);
  }

  return (
    <ErrorBoundary>
      <WizardContainer {...props} />
    </ErrorBoundary>
  );
};

export default EnvironmentWizard;
