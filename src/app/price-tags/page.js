"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  // 1. Data State: เก็บข้อมูลสินค้าที่จะแสดงบนหน้า A4
  const [products, setProducts] = useState([
    { 
      id: 1, 
      name: "@ซันไบทส์ทรัฟเฟิล", 
      size: "50ก", 
      price: 20.00, 
      packPrice: 55.00,
      updateDate: new Date().toISOString().split('T')[0],
      expiryDays: "180D",
      productCode: "A000000",
      location: "N1F3"
    }
  ]);

  // ==========================================
  // ระบบ Database จำลอง (Local Storage)
  // ==========================================
  const [productDB, setProductDB] = useState([]); // เก็บฐานข้อมูลสินค้าทั้งหมดที่เคยกรอก
  const [suggestions, setSuggestions] = useState([]); // เก็บรายการที่ค้นเจอตอนพิมพ์
  const [showSuggestions, setShowSuggestions] = useState(false); // เปิด/ปิด popup
  const wrapperRef = useRef(null); // ใช้เช็คการคลิกนอกกรอบเพื่อปิด popup

  // ดึงข้อมูลจาก Local Storage เมื่อเปิดเว็บครั้งแรก
  useEffect(() => {
    const savedDB = localStorage.getItem('priceTagDB');
    if (savedDB) {
      setProductDB(JSON.parse(savedDB));
    }
  }, []);

  // คลิกนอกกรอบ Suggestion ให้ปิด
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // State สำหรับโหมดแก้ไข
  const [editingId, setEditingId] = useState(null);

  // State สำหรับฟอร์ม
  const [nameInput, setNameInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [packPriceInput, setPackPriceInput] = useState('');
  const [updateDateInput, setUpdateDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDaysInput, setExpiryDaysInput] = useState('');
  const [productCodeInput, setProductCodeInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // -----------------------------------------
  // ฟังก์ชันจัดการการพิมพ์และแสดง Suggestion
  // -----------------------------------------
  const handleNameChange = (e) => {
    const value = e.target.value;
    setNameInput(value);

    if (value.trim().length > 0) {
      // ค้นหาใน DB ว่ามีชื่อไหนตรงกับที่พิมพ์บ้าง (ไม่สนตัวพิมพ์เล็กใหญ่)
      const matches = productDB.filter(p => 
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // ฟังก์ชันเมื่อกดเลือก Suggestion (Auto-fill)
  const handleSelectSuggestion = (product) => {
    setNameInput(product.name);
    setSizeInput(product.size === "1 ชิ้น" ? '' : product.size);
    setPriceInput(product.price);
    setPackPriceInput(product.packPrice || '');
    // updateDate เราอาจจะอยากใช้วันที่ปัจจุบัน มากกว่าดึงวันที่เก่ามา
    setUpdateDateInput(new Date().toISOString().split('T')[0]); 
    setExpiryDaysInput(product.expiryDays === "180D" ? '' : product.expiryDays);
    setProductCodeInput(product.productCode === "XXXXXXX" ? '' : product.productCode);
    setLocationInput(product.location === "1F" ? '' : product.location);
    
    setShowSuggestions(false); // ปิด Popup
  };

  // -----------------------------------------
  // ฟังก์ชันเพิ่มหรือบันทึกการแก้ไขสินค้ารายการใหม่
  // -----------------------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nameInput || !priceInput || !locationInput) return;

    const productData = {
      id: editingId ? editingId : Date.now(),
      name: nameInput,
      size: sizeInput || "1 ชิ้น",
      price: parseFloat(priceInput),
      packPrice: packPriceInput ? parseFloat(packPriceInput) : null,
      updateDate: updateDateInput,
      expiryDays: expiryDaysInput || "180D",
      productCode: productCodeInput || "XXXXXXX",
      location: locationInput || "1F"
    };

    if (editingId) {
      setProducts(products.map(p => p.id === editingId ? productData : p));
      setEditingId(null);
    } else {
      setProducts([...products, productData]);
    }

    // --- อัปเดต Database (Local Storage) ---
    const updateDB = [...productDB];
    const existingIndex = updateDB.findIndex(p => p.name.toLowerCase() === productData.name.toLowerCase());
    
    // ตัด id ทิ้งก่อนเก็บลง DB เพราะเราจำแค่ profile สินค้า
    const dbProfile = { ...productData };
    delete dbProfile.id;

    if (existingIndex >= 0) {
      updateDB[existingIndex] = dbProfile; // ถ้ามีชื่อนี้แล้ว ให้อัปเดตข้อมูลล่าสุด
    } else {
      updateDB.push(dbProfile); // ถ้าเป็นชื่อใหม่ให้เพิ่มเข้าไป
    }
    setProductDB(updateDB);
    localStorage.setItem('priceTagDB', JSON.stringify(updateDB));
    // ------------------------------------
    
    // ล้างค่าฟอร์ม
    setNameInput('');
    setSizeInput('');
    setPriceInput('');
    setPackPriceInput('');
    setExpiryDaysInput('');
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
    setExpiryDaysInput(product.expiryDays === "180D" ? '' : product.expiryDays);
    setProductCodeInput(product.productCode === "XXXXXXX" ? '' : product.productCode);
    setLocationInput(product.location === "1F" ? '' : product.location);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNameInput('');
    setSizeInput('');
    setPriceInput('');
    setPackPriceInput('');
    setExpiryDaysInput('');
    setProductCodeInput('');
    setLocationInput('');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = (id) => {
    setProducts(products.filter(p => p.id !== id));
    if (editingId === id) {
      cancelEdit();
    }
  };

  const ITEMS_PER_PAGE = 10;
  const pages = [];
  for (let i = 0; i < products.length; i += ITEMS_PER_PAGE) {
    pages.push(products.slice(i, i + ITEMS_PER_PAGE));
  }

  const formatUpdateDate = (dateString) => {
    if (!dateString) return "Update --/--/--";
    const [year, month, day] = dateString.split('-');
    const thaiYear = (parseInt(year) + 543).toString().slice(-2);
    return `Update ${day}/${month}/${thaiYear}`;
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col md:flex-row font-sans print:bg-white print:block">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />

      <aside className="w-full md:w-80 md:min-h-screen bg-white p-6 shadow-md print:hidden flex-shrink-0 z-10 md:sticky md:top-0 h-fit">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">จัดการป้ายราคา</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
          
          {/* ช่องชื่อสินค้า (เพิ่มระบบ Suggestion) */}
          <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
            <input
              type="text"
              value={nameInput}
              onChange={handleNameChange}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น @ซันไบทส์ทรัฟเฟิล"
              required
              autoComplete="off"
            />
            {/* กล่อง Popup Suggestion */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li 
                    key={idx}
                    onClick={() => handleSelectSuggestion(s)}
                    className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 flex flex-col"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ขนาด/น้ำหนัก</label>
            <input
              type="text"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น 50ก"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
            <input
              type="number"
              step="0.01"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น 20.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ราคายกแพ็ค (ไม่บังคับ)</label>
            <input
              type="number"
              step="0.01"
              value={packPriceInput}
              onChange={(e) => setPackPriceInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น 55.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">วันที่อัปเดต</label>
              <input
                type="date"
                value={updateDateInput}
                onChange={(e) => setUpdateDateInput(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">วันหมดอายุ</label>
              <input
                type="text"
                value={expiryDaysInput}
                onChange={(e) => setExpiryDaysInput(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น 180D"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">รหัสสินค้า</label>
              <input
                type="text"
                value={productCodeInput}
                onChange={(e) => setProductCodeInput(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เว้นว่าง = XXXXXXX"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                ชั้นวาง <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น N1F3"
                required
              />
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
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            *เมื่อหน้าต่างพิมพ์เด้งขึ้นมา ให้เลือก "Save as PDF"
          </p>
        </div>
      </aside>

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
              <div className="grid grid-cols-2 gap-[6mm]">
                {pageProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className={`relative border flex flex-col bg-white overflow-hidden group shadow-sm rounded-sm transition-all ${
                      editingId === product.id ? 'border-orange-500 ring-2 ring-orange-300' : 'border-gray-300'
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
                        <span>{formatUpdateDate(product.updateDate)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono font-bold leading-none mb-[4px] text-gray-800">
                        <span>{product.expiryDays || '180D'}</span>
                        <span>{product.productCode || 'XXXXXXX'}</span>
                        <span>{product.location || '1F'}</span>
                      </div>
                      <div 
                        className="w-full h-[6mm] opacity-80 mt-[2px]"
                        style={{
                          background: 'repeating-linear-gradient(to right, #222 0, #222 1.5px, transparent 1.5px, transparent 3px, #222 3px, #222 4.5px, transparent 4.5px, transparent 6px, #222 6px, #222 9px, transparent 9px, transparent 11px, #222 11px, #222 13px, transparent 13px, transparent 15px)'
                        }}
                      ></div>
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