import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <div className={styles.iconWrapper}>
              <AlertCircle size={48} className={styles.errorIcon} />
            </div>
            
            <h2 className={styles.errorTitle}>System Fault Detected</h2>
            <p className={styles.errorMessage}>
              A critical error occurred in the UI component tree.
            </p>
            
            {this.state.error && (
              <div className={styles.errorDetails}>
                <code>{this.state.error.toString()}</code>
              </div>
            )}
            
            <button className={styles.reloadBtn} onClick={this.handleReload}>
              <RefreshCw size={18} />
              <span>Reinitialize System</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
