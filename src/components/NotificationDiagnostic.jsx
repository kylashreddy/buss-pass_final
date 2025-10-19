import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

function NotificationDiagnostic() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, success = true) => {
    setResults(prev => [...prev, { message, success, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);

    try {
      // Test 1: Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        addResult("❌ No user logged in", false);
        setLoading(false);
        return;
      }
      addResult(`✅ User authenticated: ${user.email} (${user.uid})`);

      // Test 2: Try to read notifications
      try {
        const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        addResult(`✅ Can read notifications: Found ${snapshot.size} notifications`);
        
        // Test 3: Try to create a test notification
        try {
          const testDoc = await addDoc(collection(db, 'notifications'), {
            userId: user.uid,
            title: 'Test Notification',
            message: 'This is a test notification for diagnostic purposes',
            status: 'new',
            createdAt: serverTimestamp(),
            isTest: true
          });
          addResult(`✅ Can create notifications: Created test doc ${testDoc.id}`);

          // Test 4: Try to update the test notification
          try {
            await updateDoc(testDoc, { status: 'read', testUpdate: true });
            addResult(`✅ Can update notifications: Successfully updated test doc`);

            // Test 5: Clean up test notification
            try {
              await updateDoc(testDoc, { status: 'deleted' });
              addResult(`✅ Cleanup successful: Marked test notification as deleted`);
            } catch (cleanupError) {
              addResult(`⚠️ Cleanup warning: ${cleanupError.message}`, false);
            }

          } catch (updateError) {
            addResult(`❌ Cannot update notifications: ${updateError.code} - ${updateError.message}`, false);
          }

        } catch (createError) {
          addResult(`❌ Cannot create notifications: ${createError.code} - ${createError.message}`, false);
        }

      } catch (readError) {
        addResult(`❌ Cannot read notifications: ${readError.code} - ${readError.message}`, false);
      }

    } catch (error) {
      addResult(`❌ Diagnostic failed: ${error.message}`, false);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h3>🔧 Notification Diagnostic Tool</h3>
      <p>This tool tests Firebase permissions for notification operations.</p>
      
      <button 
        onClick={runDiagnostics} 
        disabled={loading}
        className="btn-chip btn-approve"
        style={{ marginBottom: 20 }}
      >
        {loading ? 'Running Tests...' : '🧪 Run Diagnostics'}
      </button>

      {results.length > 0 && (
        <div style={{ 
          background: '#f9f9f9', 
          border: '1px solid #ddd', 
          borderRadius: 8, 
          padding: 15,
          fontFamily: 'monospace',
          fontSize: 14 
        }}>
          <h4>Test Results:</h4>
          {results.map((result, index) => (
            <div 
              key={index} 
              style={{ 
                margin: '5px 0',
                color: result.success ? 'green' : 'red',
                borderLeft: `3px solid ${result.success ? 'green' : 'red'}`,
                paddingLeft: 10
              }}
            >
              [{result.timestamp}] {result.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationDiagnostic;