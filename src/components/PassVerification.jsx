import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  GraduationCap, 
  Route as RouteIcon, 
  MapPin, 
  Calendar, 
  Shield, 
  CheckCircle, 
  XCircle,
  Bus,
  CreditCard
} from 'lucide-react';

function PassVerification() {
  const [searchParams] = useSearchParams();
  const [passData, setPassData] = useState(null);
  const [isValid, setIsValid] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get pass data from URL parameters (when someone scans QR code)
    const qrData = searchParams.get('data');
    
    if (qrData) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(qrData));
        console.log('Scanned pass data:', decodedData);
        
        // Validate the pass data structure
        if (decodedData.type === 'bus-pass' && decodedData.student && decodedData.validity) {
          setPassData(decodedData);
          
          // Check if pass is still valid
          const validUntilDate = new Date(decodedData.validity.validUntil);
          const now = new Date();
          const isCurrentlyValid = validUntilDate > now && decodedData.validity.status === 'active';
          
          setIsValid(isCurrentlyValid);
        } else {
          setError('Invalid pass data format');
        }
      } catch (err) {
        console.error('Error parsing QR data:', err);
        setError('Unable to decode pass information');
      }
    }
  }, [searchParams]);

  // Manual QR data input for testing
  const [manualInput, setManualInput] = useState('');

  const handleManualVerify = () => {
    if (!manualInput.trim()) return;
    
    try {
      const parsedData = JSON.parse(manualInput);
      console.log('Manual verification data:', parsedData);
      
      if (parsedData.type === 'bus-pass') {
        setPassData(parsedData);
        const validUntilDate = new Date(parsedData.validity.validUntil);
        const now = new Date();
        setIsValid(validUntilDate > now && parsedData.validity.status === 'active');
        setError('');
      } else {
        setError('Invalid pass data');
      }
    } catch (err) {
      setError('Invalid JSON format');
    }
  };

  if (error) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: 40 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ maxWidth: 500, margin: '0 auto', background: '#fef2f2' }}
        >
          <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ color: '#dc2626', marginBottom: 10 }}>Verification Failed</h2>
          <p style={{ color: '#7f1d1d' }}>{error}</p>
        </motion.div>
      </div>
    );
  }

  if (!passData) {
    return (
      <div className="page-content" style={{ padding: 20 }}>
        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 20 }}>🎫 Bus Pass Verification</h2>
          <p style={{ textAlign: 'center', marginBottom: 20, color: '#6b7280' }}>
            Scan a QR code from a bus pass or enter the pass data manually to verify.
          </p>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 10, fontWeight: 600 }}>
              Manual Verification (Paste QR Code Data):
            </label>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Paste the JSON data from QR code here..."
              rows={6}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={handleManualVerify}
              className="btn-chip btn-approve"
              style={{ marginTop: 10 }}
            >
              <Shield size={16} /> Verify Pass
            </button>
          </div>
          
          <div style={{ 
            background: '#f3f4f6', 
            padding: 15, 
            borderRadius: 8, 
            fontSize: 14,
            color: '#4b5563' 
          }}>
            <strong>How to use:</strong>
            <ol style={{ marginTop: 10, paddingLeft: 20 }}>
              <li>Open your phone's camera or QR scanner app</li>
              <li>Point it at a bus pass QR code</li>
              <li>Tap the link that appears to verify the pass</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = () => {
    const validUntilDate = new Date(passData.validity.validUntil);
    const now = new Date();
    const diffTime = validUntilDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="page-content" style={{ padding: 20 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Verification Status */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 30,
          padding: 20,
          borderRadius: 12,
          background: isValid ? '#f0fdf4' : '#fef2f2'
        }}>
          {isValid ? (
            <>
              <CheckCircle size={56} color="#22c55e" style={{ margin: '0 auto 15px' }} />
              <h2 style={{ color: '#166534', margin: 0 }}>✅ Valid Bus Pass</h2>
              <p style={{ color: '#15803d', margin: '8px 0 0' }}>
                This pass is authentic and currently valid
              </p>
            </>
          ) : (
            <>
              <XCircle size={56} color="#ef4444" style={{ margin: '0 auto 15px' }} />
              <h2 style={{ color: '#dc2626', margin: 0 }}>❌ Invalid/Expired Pass</h2>
              <p style={{ color: '#b91c1c', margin: '8px 0 0' }}>
                This pass is either expired or invalid
              </p>
            </>
          )}
        </div>

        {/* Pass Details Card */}
        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingBottom: 15,
            borderBottom: '2px solid #f3f4f6'
          }}>
            <div>
              <h3 style={{ margin: 0, color: '#111827' }}>Campus Bus Pass</h3>
              <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
                {passData.verification?.issuer || 'Campus Transport Authority'}
              </p>
            </div>
            <div style={{ 
              background: isValid ? '#dcfce7' : '#fee2e2',
              color: isValid ? '#166534' : '#dc2626',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600
            }}>
              {isValid ? 'ACTIVE' : 'EXPIRED'}
            </div>
          </div>

          {/* Student Information */}
          <div style={{ marginBottom: 25 }}>
            <h4 style={{ margin: '0 0 15px', color: '#374151' }}>👤 Student Information</h4>
            <div className="epass-fields" style={{ display: 'grid', gap: 8 }}>
              <div className="epass-kv">
                <span className="ico"><User size={14} /></span>
                <span className="lab">Name</span>
                <span className="val">{passData.student.name}</span>
              </div>
              <div className="epass-kv">
                <span className="ico"><CreditCard size={14} /></span>
                <span className="lab">USN</span>
                <span className="val">{passData.student.usn}</span>
              </div>
              <div className="epass-kv">
                <span className="ico"><Bus size={14} /></span>
                <span className="lab">Profile</span>
                <span className="val">{passData.student.profileType}</span>
              </div>
              {passData.student.year && (
                <div className="epass-kv">
                  <span className="ico"><GraduationCap size={14} /></span>
                  <span className="lab">Year</span>
                  <span className="val">{passData.student.year}</span>
                </div>
              )}
            </div>
          </div>

          {/* Transport Information */}
          <div style={{ marginBottom: 25 }}>
            <h4 style={{ margin: '0 0 15px', color: '#374151' }}>🚌 Transport Details</h4>
            <div className="epass-fields" style={{ display: 'grid', gap: 8 }}>
              <div className="epass-kv">
                <span className="ico"><RouteIcon size={14} /></span>
                <span className="lab">Route</span>
                <span className="val">{passData.transport.route}</span>
              </div>
              <div className="epass-kv">
                <span className="ico"><MapPin size={14} /></span>
                <span className="lab">Pickup Point</span>
                <span className="val">{passData.transport.pickup}</span>
              </div>
            </div>
          </div>

          {/* Validity Information */}
          <div>
            <h4 style={{ margin: '0 0 15px', color: '#374151' }}>📅 Validity Information</h4>
            <div className="epass-fields" style={{ display: 'grid', gap: 8 }}>
              <div className="epass-kv">
                <span className="ico"><Calendar size={14} /></span>
                <span className="lab">Issued On</span>
                <span className="val">{formatDate(passData.validity.issuedOn)}</span>
              </div>
              <div className="epass-kv">
                <span className="ico"><Calendar size={14} /></span>
                <span className="lab">Valid Until</span>
                <span className="val" style={{ 
                  color: isValid ? '#059669' : '#dc2626',
                  fontWeight: 600 
                }}>
                  {formatDate(passData.validity.validUntil)}
                </span>
              </div>
              {isValid && (
                <div className="epass-kv">
                  <span className="ico"><Shield size={14} /></span>
                  <span className="lab">Days Remaining</span>
                  <span className="val" style={{ color: '#059669', fontWeight: 600 }}>
                    {getDaysRemaining()} days
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pass ID for verification */}
          <div style={{ 
            marginTop: 20,
            paddingTop: 15,
            borderTop: '1px solid #e5e7eb',
            fontSize: 12,
            color: '#6b7280',
            textAlign: 'center'
          }}>
            Pass ID: {passData.passId}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default PassVerification;