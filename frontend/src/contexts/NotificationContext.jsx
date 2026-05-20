import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {/* Toast Notifications Overlay */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {notifications.map((n) => (
          <div key={n.id} className={`alert alert-${n.type === 'error' ? 'danger' : n.type === 'info' ? 'info' : 'success'} shadow-lg`} style={{
            minWidth: '280px',
            animation: 'fadeIn 0.3s ease'
          }}>
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return { addNotification: (msg, type) => console.log(`[Notification] ${type}: ${msg}`) };
  }
  return context;
};
