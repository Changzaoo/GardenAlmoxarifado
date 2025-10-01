import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, serverTimestamp, addDoc } from 'firebase/firestore';
import { useNotificationSetup } from '../hooks/useNotificationSetup';
import { useAuth } from '../hooks/useAuth';
