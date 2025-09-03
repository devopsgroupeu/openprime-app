import React from 'react';
import WizardContainer from './wizard/WizardContainer';
import ErrorBoundary from '../ErrorBoundary';

const EnvironmentWizard = (props) => {
  return (
    <ErrorBoundary>
      <WizardContainer {...props} />
    </ErrorBoundary>
  );
};

export default EnvironmentWizard;
