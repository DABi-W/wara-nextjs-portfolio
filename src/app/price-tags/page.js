"use client";
// @ts-nocheck
/* eslint-disable */

import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [products, setProducts] = useState([]);

  // ==========================================
  // ระบบ Database (Local Storage ล้วน 100%)
  // ==========================================
  const [productDB, setProductDB] = useState([]); 
  const isCloudSynced = false; 

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
  
  const [isFetchingAPI, setIsFetchingAPI] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const scannerRef = useRef(null);

  const wrapperRef = useRef(null); 
  const locWrapperRef = useRef(null);
  const codeWrapperRef = useRef(null); 

  useEffect(() => {
    const savedDB = localStorage.getItem('priceTagDB');
    if (savedDB) {
      try {
        setProductDB(JSON.parse(savedDB));
      } catch (e) {
        console.error("Error parsing local database:", e);
      }
    }
  }, []);

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

  // -----------------------------------------
  // ระบบกล้องสแกนบาร์โค้ด
  // -----------------------------------------
  useEffect(() => {
    if (isCameraOpen) {
      const loadScanner = () => {
        if (window.Html5QrcodeScanner) {
          startScanner();
          return;
        }
        const script = document.createElement('script');
        script.src = "https://unpkg.com/html5-qrcode";
        script.onload = startScanner;
        document.body.appendChild(script);
      };

      const startScanner = () => {
        if (scannerRef.current) {
          try { scannerRef.current.clear(); } catch(e) {}
        }
        document.getElementById('reader').innerHTML = '';

        scannerRef.current = new window.Html5QrcodeScanner(
          "reader",
          { 
            fps: 30, 
            qrbox: { width: 250, height: 150 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [window.Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            videoConstraints: { 
              facingMode: "environment", 
              width: { min: 640, ideal: 1280, max: 1920 }, 
              height: { min: 480, ideal: 720, max: 1080 },
              advanced: [{ focusMode: "continuous" }] 
            }
          },
          false
        );

        scannerRef.current.render(
          (decodedText) => {
            closeScanner();
            setProductCodeInput(decodedText);
            const exactMatch = productDB.find(p => p.productCode === decodedText);
            if (exactMatch) {
              handleSelectSuggestion(exactMatch);
            } else {
              fetchProductFromAPI(decodedText);
            }
          },
          (error) => {}
        );
      };

      loadScanner();
    }
  }, [isCameraOpen, productDB]);

  const closeScanner = () => {
    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch (error) {}
    }
    setIsCameraOpen(false);
  };

  const [editingId, setEditingId] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [packPriceInput, setPackPriceInput] = useState('');
  const [updateDateInput, setUpdateDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDateInput, setExpiryDateInput] = useState(''); 
  const [productCodeInput, setProductCodeInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  
  // 🌟 เพิ่ม State สำหรับเก็บขนาดการ์ด (อัปเดตเป็น 6x4)
  const [layoutInput, setLayoutInput] = useState('6x5');

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

  const fetchProductFromAPI = async (barcode) => {
    if (!barcode || barcode.trim() === '' || barcode === 'XXXXXXX') return;
    
    setIsFetchingAPI(true);
    try {
      let response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      let data = await response.json();
      
      if (data.status === 1 && data.product) {
        const nameTH = data.product.product_name_th || data.product.product_name_en || data.product.product_name || '';
        const brand = data.product.brands || '';
        const quantity = data.product.quantity || '';
        
        let fullName = nameTH;
        if (brand && !nameTH.includes(brand)) fullName = `${brand} ${nameTH}`;

        setNameInput(fullName.trim() || 'ไม่ระบุชื่อสินค้า (จาก Food API)');
        if (quantity) setSizeInput(quantity);
        document.getElementById('price-input-field')?.focus();
        setIsFetchingAPI(false);
        return; 
      } 
      
      response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      data = await response.json();

      if (data.code === 'OK' && data.items && data.items.length > 0) {
        const item = data.items[0];
        const title = item.title || '';
        const brand = item.brand || '';
        const size = item.size || item.weight || '';

        let fullName = title;
        if (brand && !title.toLowerCase().includes(brand.toLowerCase())) fullName = `${brand} ${title}`;

        setNameInput(fullName.trim() || 'ไม่ระบุชื่อสินค้า (จาก UPC DB)');
        if (size) setSizeInput(size);
        document.getElementById('price-input-field')?.focus();
        setIsFetchingAPI(false);
        return;
      }

      alert('ℹ️ ไม่พบข้อมูลสินค้านี้ในระบบออนไลน์ (ค้นหาทั้ง 2 ฐานข้อมูลแล้ว) กรุณากรอกชื่อและราคาเองในครั้งแรกครับ');
    } catch (error) {
      console.error("API Error:", error);
      alert('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลออนไลน์ได้ หรือโควต้าฟรีรายวันอาจจะเต็มครับ');
    }
    setIsFetchingAPI(false);
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
    if (e.key === 'Enter') {
      e.preventDefault(); 
      const scannedCode = e.target.value.trim();
      if (!scannedCode) return;
      
      const exactMatch = productDB.find(p => p.productCode === scannedCode);
      if (exactMatch) {
        handleSelectSuggestion(exactMatch); 
        return;
      }

      if (showProductCodeSuggestions && activeProductCodeIndex >= 0 && activeProductCodeIndex < productCodeSuggestions.length) {
        handleSelectSuggestion(productCodeSuggestions[activeProductCodeIndex]);
        return;
      }

      fetchProductFromAPI(scannedCode);
      setShowProductCodeSuggestions(false);
      return;
    }

    if (!showProductCodeSuggestions || productCodeSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveProductCodeIndex(prev => (prev < productCodeSuggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveProductCodeIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Tab') {
      if (activeProductCodeIndex >= 0 && activeProductCodeIndex < productCodeSuggestions.length) {
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
    setLayoutInput(product.layout || '6x5'); // ดึงขนาดเดิมมาด้วย
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
          localStorage.setItem('priceTagDB', JSON.stringify(data.productDB)); 
        }
        alert('✅ โหลดข้อมูลจากไฟล์สำเร็จ!');
      } catch (err) {
        alert('❌ ไฟล์ไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const duplicateProduct = (productCodeInput && productCodeInput.trim() !== '' && productCodeInput !== 'XXXXXXX') 
    ? products.find(p => p.productCode === productCodeInput && p.id !== editingId) 
    : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nameInput || !priceInput || !locationInput) return;

    if (duplicateProduct) return; 

    const finalProductCode = productCodeInput && productCodeInput !== 'XXXXXXX' 
      ? productCodeInput 
      : `SKU-${Math.floor(Math.random() * 1000000)}`;

    const productData = {
      id: editingId ? editingId : Date.now(),
      name: nameInput,
      size: sizeInput || "1 ชิ้น",
      price: parseFloat(priceInput),
      packPrice: packPriceInput ? parseFloat(packPriceInput) : null,
      updateDate: updateDateInput,
      expiryDate: expiryDateInput, 
      productCode: finalProductCode,
      location: locationInput,
      layout: layoutInput // บันทึกขนาดที่เลือก
    };

    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? productData : p));
      setEditingId(null);
    } else {
      setProducts([...products, productData]);
    }

    const updateDB = [...productDB];
    let existingIndex = -1;
    if (productData.productCode && !productData.productCode.startsWith('SKU-')) {
      existingIndex = updateDB.findIndex(p => p.productCode === productData.productCode);
    } else {
      existingIndex = updateDB.findIndex(p => p.name.toLowerCase() === productData.name.toLowerCase());
    }
    
    const dbProfile = { ...productData };
    delete dbProfile.id;

    if (existingIndex >= 0) updateDB[existingIndex] = dbProfile;
    else updateDB.push(dbProfile);
    
    setProductDB(updateDB);
    localStorage.setItem('priceTagDB', JSON.stringify(updateDB)); 
    
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
    setProductCodeInput(product.productCode.startsWith('SKU-') ? '' : product.productCode);
    setLocationInput(product.location);
    setLayoutInput(product.layout || '6x5');
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

  // 🌟 ระบบคำนวณพื้นที่หน้ากระดาษอัจฉริยะ (ผสม 2 ขนาดได้ในหน้าเดียว)
  const pages = [];
  let currentPageGroups = [];
  let currentHeight = 0;
  let currentRow = [];
  let currentLayoutType = null;
  const MAX_PAGE_HEIGHT = 281; // 297mm (A4) - 16mm (Padding บนล่าง)

  products.forEach((product) => {
    // กำหนดค่าเริ่มต้นถ้าหากเลือก 6x4 จะใช้ 40mm ถ้า 6x5 ใช้ 50mm
    const pLayout = product.layout || '6x5';
    const pHeight = pLayout === '6x4' ? 40 : 50;

    // ถ้ามีการเปลี่ยนขนาด และแถวเดิมยังมีของอยู่ ให้ตัดขึ้นบรรทัดใหม่ทันที
    if (currentLayoutType && currentLayoutType !== pLayout && currentRow.length > 0) {
      currentPageGroups.push({ type: currentLayoutType, items: currentRow });
      currentRow = [];
    }

    // ตรวจสอบว่าถ้าขึ้นบรรทัดใหม่ จะล้นหน้ากระดาษหรือไม่?
    if (currentRow.length === 0) {
      if (currentHeight + pHeight > MAX_PAGE_HEIGHT) {
        // ล้น! ให้ยกยอดไปหน้าถัดไป
        pages.push(currentPageGroups);
        currentPageGroups = [];
        currentHeight = 0;
      }
      currentHeight += pHeight; // จองพื้นที่ความสูงสำหรับแถวใหม่
    }

    currentRow.push(product);
    currentLayoutType = pLayout;

    // 1 แถวมีได้สูงสุด 3 คอลัมน์ ถ้าเต็มแล้วให้ตัดจบแถว
    if (currentRow.length === 3) {
      currentPageGroups.push({ type: currentLayoutType, items: currentRow });
      currentRow = [];
    }
  });

  // เก็บตกเศษที่เหลือ
  if (currentRow.length > 0) {
    currentPageGroups.push({ type: currentLayoutType, items: currentRow });
  }
  if (currentPageGroups.length > 0) {
    pages.push(currentPageGroups);
  }

  const renderNumberPad = (field, align = 'left', vAlign = 'bottom') => {
    if (activePad !== field) return null;
    
    const hClass = align === 'right' ? 'right-0' : 'left-0';
    const vClass = vAlign === 'top' ? 'bottom-[calc(100%+4px)]' : 'top-[calc(100%+4px)]';

    return (
      <div className={`absolute ${vClass} ${hClass} w-[260px] bg-white border border-gray-200 rounded-md shadow-xl z-[60] p-2 pad-container`}>
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

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col md:flex-row font-sans print:bg-white print:block">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />

      {/* 🌟 Modal สำหรับเปิดกล้องสแกนบาร์โค้ด */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 rounded-xl w-full max-w-sm flex flex-col items-center">
            <h3 className="text-lg font-bold mb-2">เล็งกล้องไปที่บาร์โค้ด</h3>
            <p className="text-xs text-gray-500 mb-4 text-center">ระบบจะทำการสแกนและค้นหาข้อมูลออนไลน์อัตโนมัติ</p>
            
            <div id="reader" className="w-full min-h-[250px] bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"></div>
            
            <button 
              onClick={closeScanner}
              className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg shadow-sm"
            >
              ✕ ปิดกล้อง
          </button>
        </div>
      </div>
    )}

    <aside className="w-full md:w-80 md:min-h-screen bg-white p-6 pb-24 shadow-md print:hidden flex-shrink-0 z-10 md:sticky md:top-0 h-fit overflow-y-auto">
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

          <div className="relative pad-container" ref={codeWrapperRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
              <span>รหัสสินค้า (Barcode)</span>
              <span className="text-[10px] text-gray-400 font-normal">แสกน หรือ พิมพ์ค้นหา</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={productCodeInput}
                onChange={handleProductCodeChange}
                onKeyDown={handleProductCodeKeyDown}
                onFocus={() => { if (productCodeSuggestions.length > 0) setShowProductCodeSuggestions(true); setActivePad(null); }}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  duplicateProduct ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="คลิกแล้วยิงสแกน..."
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm"
                title="เปิดกล้องมือถือ/เว็บแคม เพื่อสแกนบาร์โค้ด"
              >
                📷 <span className="hidden sm:inline">สแกน</span>
              </button>
              
              <button
                type="button"
                onClick={() => fetchProductFromAPI(productCodeInput)}
                disabled={isFetchingAPI || !productCodeInput}
                className={`px-3 py-2 rounded-md text-white font-medium text-xs transition-colors whitespace-nowrap flex items-center gap-1 shadow-sm ${
                  isFetchingAPI || !productCodeInput ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                title="ค้นหาจากฐานข้อมูลอินเทอร์เน็ต"
              >
                {isFetchingAPI ? '⏳' : '🔍'} <span className="hidden sm:inline">ค้นหา</span>
              </button>
            </div>
            
            {showProductCodeSuggestions && productCodeSuggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
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

          <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-3">
            <div className="relative pad-container col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
            <input
              id="price-input-field"
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
            {renderNumberPad('price', 'left', 'bottom')}
          </div>

          <div className="relative pad-container">
            <label className="block text-xs font-medium text-gray-700 mb-1">ขนาด/น้ำหนัก</label>
            <input
              type="text"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              onFocus={() => setActivePad('size')}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น 50ก"
              autoComplete="off"
            />
            {renderNumberPad('size', 'left', 'top')}
          </div>

          <div className="relative pad-container">
            <label className="block text-xs font-medium text-gray-700 mb-1">ราคายกแพ็ค (ถ้ามี)</label>
            <input
              type="number"
              step="0.01"
              value={packPriceInput}
              onChange={(e) => setPackPriceInput(e.target.value)}
              onFocus={() => setActivePad('packPrice')}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น 55.00"
              autoComplete="off"
            />
            {renderNumberPad('packPrice', 'right', 'top')}
          </div>

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

            <div className="relative pad-container col-span-2" ref={locWrapperRef}>
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
            {duplicateProduct && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm shadow-sm animate-pulse mb-1">
                <strong>🚨 แจ้งเตือน:</strong> พบรหัสสินค้าซ้ำในการ์ดใบที่ {products.findIndex(p => p.id === duplicateProduct.id) + 1}<br/>
                <span className="text-xs">({duplicateProduct.name}) กรุณาตรวจสอบอีกครั้ง</span>
              </div>
            )}

            {/* 🌟 ปุ่มเลือกขนาดการ์ด (เปลี่ยนจาก 6x6 เป็น 6x4) */}
            <div className="flex gap-2 mb-1">
               <button 
                  type="button" 
                  onClick={() => setLayoutInput('6x5')} 
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-md border transition-all ${
                    layoutInput === '6x5' ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
               >
                  ขนาด 6x5 ซม. (15 ใบ/หน้า)
               </button>
               <button 
                  type="button" 
                  onClick={() => setLayoutInput('6x4')} 
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-md border transition-all ${
                    layoutInput === '6x4' ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-sm' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
               >
                  ขนาด 6x4 ซม. (21 ใบ/หน้า)
               </button>
            </div>

            <button
              type="submit"
              disabled={!!duplicateProduct}
              className={`w-full text-white font-medium py-2 px-4 rounded-md transition-colors ${
                duplicateProduct ? 'bg-gray-400 cursor-not-allowed' :
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
      <main className="flex-1 overflow-x-auto overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible flex justify-center">
        <div className="w-max flex flex-col gap-8 print:gap-0 print:block">
          {products.length === 0 && (
            <div 
              className="bg-white shadow-xl relative flex items-center justify-center text-gray-400 print:hidden"
              style={{ width: '210mm', minWidth: '210mm', height: '297mm', minHeight: '297mm' }}
            >
              ยังไม่มีรายการสินค้า กรุณาเพิ่มสินค้าที่แถบด้านซ้าย
            </div>
          )}

          {/* 🌟 แสดงผลกระดาษที่คำนวณมาอย่างแม่นยำแล้ว */}
          {pages.map((pageGroups, pageIndex) => (
            <div 
              key={pageIndex}
              className="bg-white shadow-xl print:shadow-none relative print:break-after-page mx-auto flex flex-col items-center justify-start"
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
              {pageGroups.map((group, groupIdx) => (
                <div 
                  key={groupIdx}
                  // เส้นขอบด้านบนจะมีแค่กลุ่มแรกของหน้า เพื่อไม่ให้ขอบทับซ้อนกันหนาเกินไป
                  className={`grid border-l border-gray-300 ${groupIdx === 0 ? 'border-t' : ''}`}
                  style={{ gridTemplateColumns: 'repeat(3, 60mm)', alignContent: 'start' }}
                >
                  {group.items.map((product) => (
                    <div 
                      key={product.id} 
                      className={`relative border-b border-r flex flex-col bg-white overflow-hidden group transition-all ${
                        editingId === product.id ? 'ring-2 ring-inset ring-orange-500 z-10' : 'border-gray-300'
                      }`}
                      // 🌟 ปรับความสูงของการ์ดตามที่เลือก (6x4 ใช้ 40mm)
                      style={{ width: '60mm', height: group.type === '6x4' ? '40mm' : '50mm' }} 
                    >
                      {/* ส่วนครึ่งบน (ข้อมูลสินค้าและราคา) ปรับระยะเผื่อขนาด 6x4 */}
                      <div className={`flex-1 flex flex-col justify-between ${group.type === '6x4' ? 'p-[1.5mm] px-[2.5mm]' : 'p-[2.5mm] px-[3.5mm]'}`}>
                        <div className={`${group.type === '6x4' ? 'text-[11px]' : 'text-[12px]'} font-bold leading-tight line-clamp-2 text-gray-800 tracking-tight pr-4`}>
                          {product.name}
                        </div>
                        
                        <div className="flex justify-between items-end mt-1">
                          <div className={`text-[9px] text-gray-500 font-medium ${group.type === '6x4' ? 'mb-[0px]' : 'mb-[1px]'}`}>
                            {product.size}
                          </div>
                          <div className="flex items-baseline">
                            <span className={`${group.type === '6x4' ? 'text-[26px]' : 'text-[32px]'} font-black tracking-tighter leading-none text-gray-900`}>
                              {product.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] ml-1 font-medium text-gray-700 mb-1">
                              บาท
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ส่วนครึ่งล่าง (แถบเทาข้อมูลรองและบาร์โค้ดของจริง) ย่อส่วนให้เหมาะกับ 6x4 */}
                      <div className={`bg-white border-t border-gray-300 flex flex-col justify-end ${group.type === '6x4' ? 'px-[2.5mm] py-[1mm] h-[12mm]' : 'px-[3.5mm] py-[1.5mm] h-[14mm]'}`}>
                        <div className="flex justify-between text-[7px] font-mono font-bold leading-none mb-[2px] text-gray-800">
                          <span>
                            {product.packPrice 
                              ? `Pack ${product.packPrice.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                              : ''}
                          </span>
                          <span>{formatDate(product.updateDate, 'Upd ')}</span>
                        </div>
                        <div className="flex justify-between text-[7px] font-mono font-bold leading-none mb-[2px] text-gray-800">
                          <span>{formatDate(product.expiryDate, 'Exp ')}</span>
                          <span>{product.productCode}</span>
                          <span>{product.location}</span>
                        </div>
                        
                        <div className={`w-full mt-[1px] flex justify-center overflow-hidden mix-blend-multiply opacity-90 ${group.type === '6x4' ? 'h-[3.5mm]' : 'h-[4.5mm]'}`}>
                          {product.productCode ? (
                            <img 
                              src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(product.productCode)}&includetext=false`} 
                              alt={`Barcode for ${product.productCode}`}
                              className="h-full w-full object-fill grayscale"
                              crossOrigin="anonymous"
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 print:hidden transition-opacity z-10">
                        <button 
                          onClick={() => handleEditClick(product)}
                          className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-700 shadow-md"
                          title="แก้ไขรายการ"
                        >
                          ✎
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 shadow-md"
                          title="ลบรายการนี้"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}