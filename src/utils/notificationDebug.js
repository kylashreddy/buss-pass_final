// Debug utility for notification functionality
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const debugNotifications = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No user logged in');
      return;
    }

    console.log('✅ User logged in:', user.uid, user.email);

    // Test reading notifications
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );
    
    const querySnapshot = await getDocs(q);
    console.log('📦 Found notifications:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📄 Notification:', doc.id, data);
    });

    return {
      userLoggedIn: true,
      userId: user.uid,
      notificationCount: querySnapshot.size,
      notifications: querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    };

  } catch (error) {
    console.error('❌ Debug failed:', error);
    return {
      error: error.message,
      errorCode: error.code
    };
  }
};

export const testUpdateNotification = async (notificationId) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }

    console.log('🧪 Testing update for notification:', notificationId);
    
    const ref = doc(db, 'notifications', notificationId);
    await updateDoc(ref, { 
      status: 'read', 
      readAt: serverTimestamp(),
      testUpdate: true 
    });
    
    console.log('✅ Test update successful');
    return true;

  } catch (error) {
    console.error('❌ Test update failed:', error);
    throw error;
  }
};