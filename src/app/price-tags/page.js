"use client";

import React, { useState } from 'react';

export default function App() {
  // 1. Data State: เก็บข้อมูลสินค้า โดยมี Mock Data เริ่มต้น 1 ตัว
  const [products, setProducts] = useState([
    { id: 1, name: "เลย์คลาสสิค รสเกลือ 48 ก", price: 20.00 }
  ]);

  // State สำหรับฟอร์ม
  const [nameInput, setNameInput] = useState('');
  const [priceInput, setPriceInput] = useState('');

  // ฟังก์ชันเพิ่มสินค้ารายการใหม่
  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!nameInput || !priceInput) return;

    const newProduct = {
      id: Date.now(),
      name: nameInput,
      price: parseFloat(priceInput),
    };

    setProducts([...products, newProduct]);
    
    // ล้างค่าฟอร์มหลังจากเพิ่มเสร็จ
    setNameInput('');
    setPriceInput('');
  };

  // ฟังก์ชันสั่งปริ้นท์
  const handlePrint = () => {
    window.print();
  };

  // ฟังก์ชันลบรายการ (แถมให้เผื่อใส่ผิดครับ)
  const handleDelete = (id) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans print:bg-white print:block">
      
      {/* Print CSS: ตั้งค่าหน้ากระดาษให้ไม่มี Margin เพื่อลบ Header/Footer 
        และปรับสีพื้นหลังเวลาปริ้นท์ 
      */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />

      {/* ==========================================
          ส่วนที่ 1: Input/Control (ซ่อนตอนปริ้นท์ด้วย print:hidden)
          ========================================== */}
      <aside className="w-full md:w-80 bg-white p-6 shadow-md print:hidden flex-shrink-0 z-10">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">จัดการป้ายราคา</h1>
        
        <form onSubmit={handleAddProduct} className="flex flex-col gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น น้ำดื่มสิงห์ 600มล."
              required
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
              placeholder="เช่น 10.00"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            + เพิ่มรายการ
          </button>
        </form>

        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">จำนวนรายการทั้งหมด: {products.length}</p>
          <button
            onClick={handlePrint}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md shadow-sm transition-colors flex justify-center items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            สั่งปริ้นท์ (A4)
          </button>
        </div>
      </aside>

      {/* ==========================================
          ส่วนที่ 2: A4 Print Preview
          ========================================== */}
      <main className="flex-1 overflow-auto p-4 md:p-8 flex justify-center print:p-0 print:overflow-visible">
        
        {/* คอนเทนเนอร์ขนาด A4 */}
        <div 
          className="bg-white shadow-xl print:shadow-none relative group"
          style={{ 
            width: '210mm', 
            minHeight: '297mm', // ใช้ minHeight เผื่อกรณีรายการล้นหน้าจะได้เห็นตอนพรีวิว
            padding: '10mm',    // เว้นขอบกระดาษด้านใน 10mm
          }}
        >
          {/* Label Layout: จัดเรียงด้วย CSS Grid (4 คอลัมน์) */}
          <div className="grid grid-cols-4 gap-[2mm]">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="relative border border-black p-2 flex flex-col justify-between"
                style={{ height: '35mm' }} // กำหนดความสูงของป้ายราคาให้คงที่
              >
                {/* ชื่อสินค้า (มุมบนซ้าย) */}
                <div className="text-[11px] sm:text-xs font-semibold leading-tight text-left break-words overflow-hidden" style={{ maxHeight: '2.4em' }}>
                  {product.name}
                </div>
                
                {/* ราคาและหน่วย (มุมล่างขวา) */}
                <div className="text-right mt-1">
                  <span className="text-lg sm:text-xl font-bold tracking-tight">
                    {/* จัดฟอร์แมตตัวเลขให้มีทศนิยม 2 ตำแหน่ง */}
                    {product.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] sm:text-xs ml-1 font-normal text-gray-700">
                    บาท
                  </span>
                </div>

                {/* ปุ่มลบ (แสดงเฉพาะตอน hover ในจอ ซ่อนตอนปริ้นท์) */}
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 hover:bg-red-700 print:hidden transition-opacity"
                  title="ลบรายการนี้"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* ข้อความกรณีไม่มีสินค้า (ซ่อนตอนปริ้นท์) */}
          {products.length === 0 && (
            <div className="h-full w-full flex items-center justify-center text-gray-400 print:hidden mt-20">
              ยังไม่มีรายการสินค้า กรุณาเพิ่มสินค้าที่แถบด้านซ้าย
            </div>
          )}
        </div>

      </main>
    </div>
  );
}