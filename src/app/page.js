import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* ส่วน Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-900">Wara.Dev</h1>
          <nav>
            <a href="#about" className="mx-2 hover:text-blue-600">About</a>
            <a href="#projects" className="mx-2 hover:text-blue-600">Projects</a>
          </nav>
        </div>
      </header>

      {/* ส่วน Hero (หน้าแรก) */}
      <section className="py-20 text-center bg-blue-900 text-white">
        <h2 className="text-4xl font-bold mb-4">สวัสดีครับ ผมวรา</h2>
        <p className="text-xl mb-8">Frontend Developer | Specialist in SharePoint & Internal Tools</p>
        <button className="bg-white text-blue-900 px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition">
          ดูผลงานของผม
        </button>
      </section>

      {/* ส่วน Projects */}
      <section id="projects" className="container mx-auto px-4 py-16">
        <h3 className="text-2xl font-bold text-center mb-8">ผลงานที่คัดเลือก (Projects)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="h-48 bg-gray-300 flex items-center justify-center">
              <span>รูปตัวอย่างโปรเจกต์</span>
            </div>
            <div className="p-6">
              <h4 className="text-xl font-bold mb-2">Leave Request System</h4>
              <p className="text-gray-600 mb-4">ระบบคำนวณวันลาพักร้อน อัตโนมัติ ช่วยลดงาน HR</p>
              <div className="flex gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Next.js</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Tailwind</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
             <div className="h-48 bg-gray-300 flex items-center justify-center">
              <span>Coming Soon</span>
            </div>
            <div className="p-6">
              <h4 className="text-xl font-bold mb-2">Project Name</h4>
              <p className="text-gray-600 mb-4">คำอธิบายโปรเจกต์สั้นๆ</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}