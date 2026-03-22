"use client";

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// ==========================================
// ตั้งค่า Firebase สำหรับเชื่อมต่อ Cloud Storage
// ==========================================
let app, auth, db;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

if (typeof __firebase_config !== 'undefined') {
  const firebaseConfig = JSON.parse(__firebase_config);
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);

  // ==========================================
  // ระบบ Database (Cloud Storage)
  // ==========================================
  const [productDB, setProductDB] = useState([]); 
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false); 
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState(-1);

  const [productCodeSuggestions, setProductCodeSuggestions] = useState([]);
  const [showProductCodeSuggestions, setShowProductCodeSuggestions] = useState(false);
  const [activeProductCodeIndex, setActiveProductCodeIndex] = useState(-1);

  const [activePad, setActivePad] = useState(null); 

  const wrapperRef = useRef(null); 
  const locWrapperRef = useRef(null);
  const codeWrapperRef = useRef(null); 

  // 1. ตรวจสอบการยืนยันตัวตน (Auth)
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. ดึงข้อมูลประวัติสินค้าจากระบบ Cloud แบบ Real-time
  useEffect(() => {
    if (!user || !db) return;
    
    // อ้างอิงพิกัดเก็บข้อมูลส่วนตัวของผู้ใช้
    const dbRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'productDB');
    
    const unsubscribe = onSnapshot(dbRef, (docSnap) => {
      if (docSnap.exists()) {
        setProductDB(docSnap.data().items || []);
      } else {
        setProductDB([]);
      }
      setIsCloudSynced(true);
    }, (error) => {
      console.error("Firestore error:", error);
    });
    
    return () => unsubscribe();
  }, [user]);

  // ฟังก์ชันอัปเดตข้อมูลขึ้น Cloud
  const saveToCloud = async (newDB) => {
    if (!user || !db) return;
    try {
      const dbRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'productDB');
      await setDoc(dbRef, { items: newDB });
    } catch (error) {
      console.error("Error saving to cloud:", error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setShowSuggestions(false);
      if (locWrapperRef.current && !locWrapperRef.current.contains(event.target)) setShowLocationSuggestions(false);
      if (codeWrapperRef.current && !codeWrapperRef.current.contains(event.target)) setShowProductCodeSuggestions(false);
      if (!event.target.closest('.pad-container')) setActivePad(null); 
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [editingId, setEditingId] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [packPriceInput, setPackPriceInput] = useState('');
  const [updateDateInput, setUpdateDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDateInput, setExpiryDateInput] = useState(''); 
  const [productCodeInput, setProductCodeInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // -----------------------------------------
  // ฟังก์ชันจัดรูปแบบวันที่ (แสดงเป็น ปี ค.ศ. 4 หลัก)
  // -----------------------------------------
  const formatDate = (dateString, prefix = "") => {
    if (!dateString) return `${prefix}--/--/----`;
    const [year, month, day] = dateString.split('-');
    return `${prefix}${day}/${month}/${year}`;
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setNameInput(value);
    setActiveSuggestionIndex(-1); 
    if (value.trim().length > 0) {
      const matches = productDB.filter(p => p.name.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleNameKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        if (e.key === 'Enter') e.preventDefault(); 
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      }
    }
  };

  const handleProductCodeChange = (e) => {
    const value = e.target.value;
    setProductCodeInput(value);
    setActiveProductCodeIndex(-1);
    if (value.trim().length > 0) {
      const matches = productDB.filter(p => 
        p.productCode && p.productCode.toLowerCase().includes(value.toLowerCase())
      );
      setProductCodeSuggestions(matches);
      setShowProductCodeSuggestions(true);
    } else {
      setShowProductCodeSuggestions(false);
    }
  };

  const handleProductCodeKeyDown = (e) => {
    if (!showProductCodeSuggestions || productCodeSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveProductCodeIndex(prev => (prev < productCodeSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveProductCodeIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (activeProductCodeIndex >= 0 && activeProductCodeIndex < productCodeSuggestions.length) {
        if (e.key === 'Enter') e.preventDefault(); 
        handleSelectSuggestion(productCodeSuggestions[activeProductCodeIndex]);
      }
    }
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);
    setActiveLocationIndex(-1); 
    if (value.trim().length > 0) {
      const uniqueLocations = Array.from(new Set(productDB.map(p => p.location).filter(Boolean)));
      const matches = uniqueLocations.filter(loc => loc.toLowerCase().includes(value.toLowerCase()));
      setLocationSuggestions(matches);
      setShowLocationSuggestions(true);
    } else {
      setShowLocationSuggestions(false);
    }
  };

  const handleLocationKeyDown = (e) => {
    if (!showLocationSuggestions || locationSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveLocationIndex(prev => (prev < locationSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveLocationIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (activeLocationIndex >= 0 && activeLocationIndex < locationSuggestions.length) {
        if (e.key === 'Enter') e.preventDefault();
        setLocationInput(locationSuggestions[activeLocationIndex]);
        setShowLocationSuggestions(false);
      }
    }
  };

  const handleSelectSuggestion = (product) => {
    setNameInput(product.name);
    setSizeInput(product.size === "1 ชิ้น" ? '' : product.size);
    setPriceInput(product.price);
    setPackPriceInput(product.packPrice || '');
    setUpdateDateInput(new Date().toISOString().split('T')[0]); 
    setExpiryDateInput(product.expiryDate || '');
    setProductCodeInput(product.productCode === "XXXXXXX" ? '' : product.productCode);
    setLocationInput(product.location === "1F" ? '' : product.location);
    setShowSuggestions(false); 
    setShowProductCodeSuggestions(false); 
  };

  const QUICK_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 50, 100];
  
  const handleNumberAdd = (field, amount) => {
    if (field === 'price') {
      setPriceInput(prev => (parseFloat(prev || 0) + amount).toString());
    } else if (field === 'packPrice') {
      setPackPriceInput(prev => (parseFloat(prev || 0) + amount).toString());
    } else if (field === 'size') {
      const str = sizeInput || "";
      const match = str.match(/^([\d.]+)(.*)$/);
      if (match) {
        const num = parseFloat(match[1]) + amount;
        setSizeInput(num + match[2]);
      } else {
        const num = parseFloat(str);
        if (!isNaN(num)) setSizeInput((num + amount).toString());
        else setSizeInput(amount.toString());
      }
    }
  };

  const exportData = () => {
    const data = { products, productDB };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price_tags_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.products) setProducts(data.products);
        if (data.productDB) {
          setProductDB(data.productDB);
          saveToCloud(data.productDB); // ซิงค์ไฟล์ที่โหลดขึ้นคลาวด์ด้วย
        }
        alert('✅ โหลดข้อมูลจากไฟล์สำเร็จ!');
      } catch (err) {
        alert('❌ ไฟล์ไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nameInput || !priceInput || !locationInput) return;

    // ระบบแจ้งเตือนหากพยายามเพิ่มรหัสสินค้าที่ซ้ำกับรายการที่มีอยู่แล้วในหน้าพิมพ์
    if (productCodeInput && productCodeInput.trim() !== '' && productCodeInput !== 'XXXXXXX') {
      const isDuplicateInList = products.some(p => p.productCode === productCodeInput && p.id !== editingId);
      if (isDuplicateInList) {
        alert('🚨 มีสินค้ารหัสนี้อยู่ในรายการพิมพ์แล้วครับ ไม่สามารถเพิ่มซ้ำได้!');
        return; // ยกเลิกการบันทึก
      }
    }

    const productData = {
      id: editingId ? editingId : Date.now(),
      name: nameInput,
      size: sizeInput || "1 ชิ้น",
      price: parseFloat(priceInput),
      packPrice: packPriceInput ? parseFloat(packPriceInput) : null,
      updateDate: updateDateInput,
      expiryDate: expiryDateInput, 
      productCode: productCodeInput || "XXXXXXX",
      location: locationInput
    };

    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? productData : p));
      setEditingId(null);
    } else {
      setProducts([...products, productData]);
    }

    const updateDB = [...productDB];
    // อัปเดตฐานข้อมูลอ้างอิงจากรหัสสินค้า (ถ้ามี) หรือชื่อสินค้า
    let existingIndex = -1;
    if (productData.productCode !== 'XXXXXXX') {
      existingIndex = updateDB.findIndex(p => p.productCode === productData.productCode);
    } else {
      existingIndex = updateDB.findIndex(p => p.name.toLowerCase() === productData.name.toLowerCase());
    }
    
    const dbProfile = { ...productData };
    delete dbProfile.id;

    if (existingIndex >= 0) updateDB[existingIndex] = dbProfile;
    else updateDB.push(dbProfile);
    
    setProductDB(updateDB);
    saveToCloud(updateDB); // บันทึกขึ้น Cloud 
    
    setNameInput('');
    setSizeInput('');
    setPriceInput('');
    setPackPriceInput('');
    setExpiryDateInput('');
    setProductCodeInput('');
    setLocationInput('');
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setNameInput(product.name);
    setSizeInput(product.size === "1 ชิ้น" ? '' : product.size);
    setPriceInput(product.price);
    setPackPriceInput(product.packPrice || '');
    setUpdateDateInput(product.updateDate);
    setExpiryDateInput(product.expiryDate || '');
    setProductCodeInput(product.productCode === "XXXXXXX" ? '' : product.productCode);
    setLocationInput(product.location);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNameInput('');
    setSizeInput('');
    setPriceInput('');
    setPackPriceInput('');
    setExpiryDateInput('');
    setProductCodeInput('');
    setLocationInput('');
  };

  const handlePrint = () => window.print();
  const handleDelete = (id) => {
    setProducts(products.filter(p => p.id !== id));
    if (editingId === id) cancelEdit();
  };

  const ITEMS_PER_PAGE = 10;
  const pages = [];
  for (let i = 0; i < products.length; i += ITEMS_PER_PAGE) {
    pages.push(products.slice(i, i + ITEMS_PER_PAGE));
  }

  const renderNumberPad = (field) => {
    if (activePad !== field) return null;
    return (
      <div className="absolute top-full left-0 mt-1 w-[260px] bg-white border border-gray-200 rounded-md shadow-xl z-50 p-2 pad-container">
        <div className="text-[10px] text-gray-500 mb-2 font-medium">💡 กดเพื่อบวกตัวเลขเพิ่ม</div>
        <div className="grid grid-cols-5 gap-1">
          {QUICK_NUMBERS.map(num => (
            <button
              key={num}
              type="button"
              tabIndex={-1} 
              onClick={() => handleNumberAdd(field, num)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-1.5 rounded text-xs transition-colors border border-blue-200"
            >
              +{num}
            </button>
          ))}
          <button
            type="button"
            tabIndex={-1} 
            onClick={() => {
              if (field === 'size') setSizeInput('');
              if (field === 'price') setPriceInput('');
              if (field === 'packPrice') setPackPriceInput('');
            }}
            className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-1.5 rounded text-xs transition-colors border border-red-200 col-span-5 mt-1"
          >
            ⌫ เคลียร์ค่า
          </button>
        </div>
      </div>
    );
  };

  // ตรวจเช็คสถานะว่ารหัสสินค้าที่พิมพ์มาซ้ำไหม
  const isDuplicateCode = productCodeInput && productCodeInput.trim() !== '' && productCodeInput !== 'XXXXXXX' && products.some(p => p.productCode === productCodeInput && p.id !== editingId);

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col md:flex-row font-sans print:bg-white print:block">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />

      <aside className="w-full md:w-80 md:min-h-screen bg-white p-6 shadow-md print:hidden flex-shrink-0 z-10 md:sticky md:top-0 h-fit overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">จัดการป้ายราคา</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
          
          <div className="relative pad-container" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
            <input
              type="text"
              value={nameInput}
              onChange={handleNameChange}
              onKeyDown={handleNameKeyDown} 
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); setActivePad(null); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น โค้ก กระป๋อง"
              required
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li 
                    key={idx}
                    onClick={() => handleSelectSuggestion(s)}
                    className={`px-3 py-2 text-sm cursor-pointer border-b border-gray-100 last:border-0 flex flex-col ${
                      idx === activeSuggestionIndex ? 'bg-blue-100' : 'hover:bg-blue-50'
                    }`} 
                  >
                    <span className="font-semibold text-gray-800">{s.name}</span>
                    <span className="text-xs text-gray-500">
                      ราคา: {s.price} บ. | รหัส: {s.productCode}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative pad-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">ขนาด/น้ำหนัก</label>
            <input
              type="text"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              onFocus={() => setActivePad('size')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น 50ก"
              autoComplete="off"
            />
            {renderNumberPad('size')}
          </div>

          <div className="relative pad-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
            <input
              type="number"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              onFocus={() => setActivePad('price')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น 20.00"
              required
              autoComplete="off"
            />
            {renderNumberPad('price')}
          </div>

          <div className="relative pad-container">
            <label className="block text-sm font-medium text-gray-700 mb-1">ราคายกแพ็ค (ไม่บังคับ)</label>
            <input
              type="number"
              step="0.01"
              value={packPriceInput}
              onChange={(e) => setPackPriceInput(e.target.value)}
              onFocus={() => setActivePad('packPrice')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น 55.00"
              autoComplete="off"
            />
            {renderNumberPad('packPrice')}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">วันที่อัปเดต</label>
              <input
                type="date"
                value={updateDateInput}
                onChange={(e) => setUpdateDateInput(e.target.value)}
                onFocus={() => setActivePad(null)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">วันหมดอายุ</label>
              <input
                type="date"
                value={expiryDateInput}
                onChange={(e) => setExpiryDateInput(e.target.value)}
                onFocus={() => setActivePad(null)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
              />
            </div>

            {/* ช่องรหัสสินค้า (เพิ่ม Suggestion และระบบแจ้งเตือนซ้ำ) */}
            <div className="relative pad-container" ref={codeWrapperRef}>
              <label className="block text-xs font-medium text-gray-700 mb-1">รหัสสินค้า</label>
              <input
                type="text"
                value={productCodeInput}
                onChange={handleProductCodeChange}
                onKeyDown={handleProductCodeKeyDown}
                onFocus={() => { if (productCodeSuggestions.length > 0) setShowProductCodeSuggestions(true); setActivePad(null); }}
                className={`w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 ${
                  isDuplicateCode ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="เว้นว่าง = XXXXXXX"
                autoComplete="off"
              />
              {isDuplicateCode && (
                <p className="text-[10px] text-red-500 mt-0.5 font-medium absolute top-full left-0 w-full z-10">
                  🚨 ถูกเพิ่มไปในการพิมพ์แล้ว
                </p>
              )}
              {showProductCodeSuggestions && productCodeSuggestions.length > 0 && (
                <ul className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
                  {productCodeSuggestions.map((s, idx) => (
                    <li 
                      key={idx}
                      onClick={() => handleSelectSuggestion(s)}
                      className={`px-3 py-2 text-sm cursor-pointer border-b border-gray-100 last:border-0 flex flex-col ${
                        idx === activeProductCodeIndex ? 'bg-blue-100' : 'hover:bg-blue-50'
                      }`} 
                    >
                      <span className="font-semibold text-gray-800">{s.productCode || 'ไม่มีรหัส'}</span>
                      <span className="text-xs text-gray-500">{s.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="relative pad-container" ref={locWrapperRef}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                ชั้นวาง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={locationInput}
                onChange={handleLocationChange}
                onKeyDown={handleLocationKeyDown} 
                onFocus={() => { if (locationSuggestions.length > 0) setShowLocationSuggestions(true); setActivePad(null); }}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น N1F3"
                required
                autoComplete="off"
              />
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <ul className="absolute bottom-full left-0 mb-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto z-50">
                  {locationSuggestions.map((loc, idx) => (
                    <li 
                      key={idx}
                      onClick={() => { setLocationInput(loc); setShowLocationSuggestions(false); }}
                      className={`px-3 py-1.5 text-sm cursor-pointer border-b border-gray-100 last:border-0 ${
                        idx === activeLocationIndex ? 'bg-blue-100' : 'hover:bg-blue-50'
                      }`} 
                    >
                      {loc}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              type="submit"
              className={`w-full text-white font-medium py-2 px-4 rounded-md transition-colors ${
                editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {editingId ? '✓ บันทึกการแก้ไข' : '+ เพิ่มรายการ'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
              >
                ✕ ยกเลิกการแก้ไข
              </button>
            )}
          </div>
        </form>

        <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold text-gray-700">💾 จัดการฐานข้อมูล</p>
            {isCloudSynced ? (
              <span className="text-[10px] text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1" title="ข้อมูลเชื่อมต่อกับระบบคลาวด์แล้ว">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ☁️ ออนไลน์
              </span>
            ) : (
              <span className="text-[10px] text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1" title="บันทึกข้อมูลในเครื่องเท่านั้น">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> 💻 ออฟไลน์
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={exportData} className="flex-1 bg-gray-800 hover:bg-black text-white py-2 rounded-md text-xs font-medium transition-colors text-center" title="เซฟข้อมูลเก็บไว้เป็นไฟล์">
              บันทึกไฟล์ (Save)
            </button>
            <label className="flex-1 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-center" title="โหลดข้อมูลจากไฟล์กลับมา">
              โหลดไฟล์ (Load)
              <input type="file" accept=".json" className="hidden" onChange={importData} />
            </label>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">รวม: {products.length} รายการ</p>
            <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">ใช้กระดาษ: {pages.length} หน้า</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={handlePrint}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md shadow-sm transition-colors flex justify-center items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              สั่งปริ้นท์ (A4)
            </button>
            
            <button
              onClick={handlePrint}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-md shadow-sm transition-colors flex justify-center items-center gap-2"
              title="เลือกปลายทางเป็น 'บันทึกเป็น PDF' ในหน้าต่างปริ้นท์"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              บันทึกเป็น PDF
            </button>
          </div>
        </div>
      </aside>

      {/* ==========================================
          ส่วนที่ 2: Print Preview
          ========================================== */}
      <main className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
        <p className="md:hidden text-xs text-center text-gray-500 mb-4 print:hidden animate-pulse">
          👈 เลื่อนซ้าย-ขวาเพื่อดูเต็มแผ่น 👉
        </p>

        <div className="w-max mx-auto flex flex-col gap-8 print:gap-0 print:block">
          {products.length === 0 && (
            <div 
              className="bg-white shadow-xl relative flex items-center justify-center text-gray-400 print:hidden"
              style={{ width: '210mm', minWidth: '210mm', height: '297mm', minHeight: '297mm' }}
            >
              ยังไม่มีรายการสินค้า กรุณาเพิ่มสินค้าที่แถบด้านซ้าย
            </div>
          )}

          {pages.map((pageProducts, pageIndex) => (
            <div 
              key={pageIndex}
              className="bg-white shadow-xl print:shadow-none relative print:break-after-page"
              style={{ 
                width: '210mm', 
                minWidth: '210mm',
                height: '297mm', 
                minHeight: '297mm',
                padding: '8mm',
                boxSizing: 'border-box',
                pageBreakAfter: pageIndex === pages.length - 1 ? 'auto' : 'always',
                breakAfter: pageIndex === pages.length - 1 ? 'auto' : 'page',
              }}
            >
              {/* เปลี่ยน Grid เป็นแนบชิดติดกัน (gap-0) และทำขอบตารางแบบแชร์เส้น */}
              <div className="grid grid-cols-2 gap-0 border-t border-l border-gray-300">
                {pageProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className={`relative border-b border-r flex flex-col bg-white overflow-hidden group transition-all ${
                      editingId === product.id ? 'ring-2 ring-inset ring-orange-500 z-10' : 'border-gray-300'
                    }`}
                    style={{ height: '2in' }} 
                  >
                    <div className="flex-1 p-[4mm] px-[6mm] flex flex-col justify-between">
                      <div className="text-[16px] font-bold leading-tight line-clamp-2 text-gray-800 tracking-tight pr-6">
                        {product.name}
                      </div>
                      
                      <div className="flex justify-between items-end mt-1">
                        <div className="text-[14px] text-gray-500 font-medium mb-[4px]">
                          {product.size}
                        </div>
                        <div className="flex items-baseline">
                          <span className="text-[52px] font-black tracking-tighter leading-none text-gray-900">
                            {product.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[12px] ml-2 font-medium text-gray-700 mb-2">
                            บาท
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white px-[6mm] py-[2mm] flex flex-col justify-end border-t border-gray-300" style={{ height: '18mm' }}>
                      <div className="flex justify-between text-[10px] font-mono font-bold leading-none mb-[2px] text-gray-800">
                        <span>
                          {product.packPrice 
                            ? `Pack ${product.packPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bath` 
                            : ''}
                        </span>
                        <span>{formatDate(product.updateDate, 'Update ')}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono font-bold leading-none mb-[4px] text-gray-800">
                        <span>{formatDate(product.expiryDate, 'Exp ')}</span>
                        <span>{product.productCode || 'XXXXXXX'}</span>
                        <span>{product.location}</span>
                      </div>
                      
                      <div className="w-full h-[6mm] mt-[2px]">
                        <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 10">
                          <path d="M0,0 h2 v10 h-2 Z M4,0 h1 v10 h-1 Z M7,0 h3 v10 h-3 Z M12,0 h1 v10 h-1 Z M15,0 h2 v10 h-2 Z M20,0 h3 v10 h-3 Z M25,0 h1 v10 h-1 Z M28,0 h2 v10 h-2 Z M33,0 h1 v10 h-1 Z M36,0 h4 v10 h-4 Z M42,0 h2 v10 h-2 Z M46,0 h1 v10 h-1 Z M49,0 h3 v10 h-3 Z M54,0 h2 v10 h-2 Z M58,0 h1 v10 h-1 Z M61,0 h2 v10 h-2 Z M65,0 h3 v10 h-3 Z M70,0 h1 v10 h-1 Z M73,0 h2 v10 h-2 Z M77,0 h4 v10 h-4 Z M83,0 h2 v10 h-2 Z M87,0 h1 v10 h-1 Z M90,0 h3 v10 h-3 Z M95,0 h2 v10 h-2 Z M99,0 h1 v10 h-1 Z" fill="#333" />
                        </svg>
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 print:hidden transition-opacity z-10">
                      <button 
                        onClick={() => handleEditClick(product)}
                        className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-blue-700 shadow-md"
                        title="แก้ไขรายการ"
                      >
                        ✎
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-700 shadow-md"
                        title="ลบรายการนี้"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}