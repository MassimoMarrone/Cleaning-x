import { BrowserRouter } from 'react-router-dom';
import './App.css';
import './styles/Loading.css';
import './styles/Toast.css';
import Header from './components/Header';
import AppRoutes from './routes/AppRoutes';
import AuthModal from './components/AuthModal';
import ToastContainer from './components/ToastContainer';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';

function App() {
  const { toasts, removeToast, showSuccess, showError } = useToast();
  
  const {
    showModal,
    modalType,
    isLoggedIn,
    userRole,
    handleOpenModal,
    handleCloseModal,
    handleAuthSubmit,
    handleLogout,
    setModalType,
    setUserRole
  } = useAuth({
    onShowSuccess: showSuccess,
    onShowError: showError
  });

  return (
    <BrowserRouter>
      <div className="homepage">
        <Header 
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          onOpenModal={handleOpenModal}
          onLogout={handleLogout}
          onRoleChange={setUserRole}
        />
        
        <AppRoutes isLoggedIn={isLoggedIn} userRole={userRole} />
        
        <AuthModal 
          showModal={showModal}
          modalType={modalType}
          onClose={handleCloseModal}
          onSubmit={handleAuthSubmit}
          onSwitchType={setModalType}
        />

        <ToastContainer 
          toasts={toasts} 
          onRemove={removeToast} 
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
