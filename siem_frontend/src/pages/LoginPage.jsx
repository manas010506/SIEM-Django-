import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login(username, password);
      // Wait a moment for the animation to play before navigating
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    }
  };

  // Staggered animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.animatedBackground}>
        <div className={styles.gridOverlay}></div>
        <div className={styles.radialGradient}></div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          className={styles.loginCard}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          key="login-form"
        >
          <motion.div className={styles.logoSection} variants={itemVariants}>
            <div className={styles.iconWrapper}>
              <ShieldAlert size={40} className={styles.logoIcon} />
            </div>
            <h1 className={styles.title}>SIEM Control Center</h1>
            <p className={styles.subtitle}>Security Information & Event Management</p>
          </motion.div>

          {error && (
            <motion.div 
              className={styles.errorAlert}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', scale: [1, 1.02, 1] }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.form 
            className={styles.form} 
            onSubmit={handleSubmit}
            variants={containerVariants}
          >
            <motion.div className={styles.inputGroup} variants={itemVariants}>
              <label htmlFor="username">Operator ID</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input 
                  type="text" 
                  id="username"
                  placeholder="Enter your username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  className={styles.input}
                  autoComplete="username"
                />
              </div>
            </motion.div>

            <motion.div className={styles.inputGroup} variants={itemVariants}>
              <label htmlFor="password">Access Code</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input 
                  type="password" 
                  id="password"
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className={styles.input}
                  autoComplete="current-password"
                />
              </div>
            </motion.div>

            <motion.button 
              type="submit" 
              className={styles.submitBtn}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className={styles.loader}>
                  <div className={styles.spinner}></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Initialize Session</span>
                  <ArrowRight size={18} />
                </>
              )}
              <div className={styles.btnGlow}></div>
            </motion.button>
          </motion.form>

          <motion.div className={styles.footer} variants={itemVariants}>
            <div className={styles.statusDot}></div>
            <span className={styles.statusText}>System Status: ONLINE</span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
