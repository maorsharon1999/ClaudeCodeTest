import React from 'react';
import ScreenHeader from '../visual/ScreenHeader';

export default function Header({ title, subtitle, onBack, right, rightAction, navigation, style }) {
  // Resolve back handler: function → call directly, true → navigation.goBack()
  let backHandler = undefined;
  if (typeof onBack === 'function') {
    backHandler = onBack;
  } else if (onBack === true && navigation) {
    backHandler = () => navigation.goBack();
  } else if (onBack) {
    backHandler = onBack;
  }

  return (
    <ScreenHeader
      title={title}
      subtitle={subtitle}
      onBack={backHandler}
      right={right || rightAction}
    />
  );
}
