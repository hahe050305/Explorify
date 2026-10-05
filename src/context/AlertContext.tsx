// src/context/AlertContext.tsx
// ─────────────────────────────────────────────────────────
// Global Alert Context for Explorify
// Minimalistic, modern branded alert dialogs across the app
// ─────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import CustomAlertModal, { AlertConfig, AlertType, AlertButton } from '../components/CustomAlertModal';

export type ShowAlertOptions = {
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
  dismissible?: boolean;
};

export type AlertContextType = {
  showAlert: (
    titleOrOptions: string | ShowAlertOptions,
    message?: string,
    buttons?: AlertButton[],
    type?: AlertType,
    dismissible?: boolean
  ) => void;
  hideAlert: () => void;
  showSuccess: (title: string, message?: string, buttons?: AlertButton[]) => void;
  showError: (title: string, message?: string, buttons?: AlertButton[]) => void;
  showWarning: (title: string, message?: string, buttons?: AlertButton[]) => void;
  showInfo: (title: string, message?: string, buttons?: AlertButton[]) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Global handler reference to allow alert triggers from outside component trees
let globalAlertHandler: ((options: ShowAlertOptions) => void) | null = null;

function detectTypeFromTitle(title: string): AlertType {
  const t = title.toLowerCase();
  if (
    t.includes('success') ||
    t.includes('confirmed') ||
    t.includes('placed') ||
    t.includes('created') ||
    t.includes('reset') ||
    t.includes('saved') ||
    t.includes('copied') ||
    t.includes('done') ||
    t.includes('welcome')
  ) {
    return 'success';
  }
  if (
    t.includes('error') ||
    t.includes('fail') ||
    t.includes('invalid') ||
    t.includes('denied') ||
    t.includes('mismatch') ||
    t.includes('short') ||
    t.includes('wrong') ||
    t.includes('cannot') ||
    t.includes('unable') ||
    t.includes('failed')
  ) {
    return 'error';
  }
  if (
    t.includes('warning') ||
    t.includes('required') ||
    t.includes('sign out') ||
    t.includes('logout') ||
    t.includes('sign in') ||
    t.includes('guest') ||
    t.includes('permission') ||
    t.includes('missing') ||
    t.includes('caution') ||
    t.includes('attention') ||
    t.includes('alert')
  ) {
    return 'warning';
  }
  return 'info';
}

function normalizeAlertOptions(
  titleOrOptions: string | ShowAlertOptions,
  message?: string,
  buttons?: AlertButton[],
  type?: AlertType,
  dismissible?: boolean
): ShowAlertOptions {
  if (typeof titleOrOptions === 'object') {
    return {
      ...titleOrOptions,
      type: titleOrOptions.type || detectTypeFromTitle(titleOrOptions.title),
    };
  }

  return {
    title: titleOrOptions,
    message,
    buttons,
    type: type || detectTypeFromTitle(titleOrOptions),
    dismissible,
  };
}

// ─────────────────────────────────────────────────────────
// Global Imperative Alert API
// Can be called anywhere (even outside React hooks / components)
// ─────────────────────────────────────────────────────────
type CustomAlertFunction = {
  (
    titleOrOptions: string | ShowAlertOptions,
    message?: string,
    buttons?: AlertButton[],
    type?: AlertType,
    dismissible?: boolean
  ): void;
  success: (title: string, message?: string, buttons?: AlertButton[]) => void;
  error: (title: string, message?: string, buttons?: AlertButton[]) => void;
  warning: (title: string, message?: string, buttons?: AlertButton[]) => void;
  info: (title: string, message?: string, buttons?: AlertButton[]) => void;
};

const customAlertBase = (
  titleOrOptions: string | ShowAlertOptions,
  message?: string,
  buttons?: AlertButton[],
  type?: AlertType,
  dismissible?: boolean
) => {
  if (globalAlertHandler) {
    const options = normalizeAlertOptions(titleOrOptions, message, buttons, type, dismissible);
    globalAlertHandler(options);
  } else {
    console.warn('[Alert] AlertContext not initialized yet.');
  }
};

export const customAlert: CustomAlertFunction = Object.assign(customAlertBase, {
  success: (title: string, message?: string, buttons?: AlertButton[]) => {
    customAlertBase({ title, message, buttons, type: 'success' });
  },
  error: (title: string, message?: string, buttons?: AlertButton[]) => {
    customAlertBase({ title, message, buttons, type: 'error' });
  },
  warning: (title: string, message?: string, buttons?: AlertButton[]) => {
    customAlertBase({ title, message, buttons, type: 'warning' });
  },
  info: (title: string, message?: string, buttons?: AlertButton[]) => {
    customAlertBase({ title, message, buttons, type: 'info' });
  },
});

// ─────────────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────────────
export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
    dismissible: true,
  });

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback(
    (
      titleOrOptions: string | ShowAlertOptions,
      message?: string,
      buttons?: AlertButton[],
      type?: AlertType,
      dismissible?: boolean
    ) => {
      const finalConfig = normalizeAlertOptions(titleOrOptions, message, buttons, type, dismissible);

      setAlertConfig({
        visible: true,
        ...finalConfig,
      });
    },
    []
  );

  const showSuccess = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({ title, message, buttons, type: 'success' });
    },
    [showAlert]
  );

  const showError = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({ title, message, buttons, type: 'error' });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({ title, message, buttons, type: 'warning' });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      showAlert({ title, message, buttons, type: 'info' });
    },
    [showAlert]
  );

  // Set global handler
  globalAlertHandler = (options: ShowAlertOptions) => {
    showAlert(options);
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        hideAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <CustomAlertModal config={alertConfig} onClose={hideAlert} />
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextType {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
