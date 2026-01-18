"use client";
import React from 'react';
import { Mail, Phone, MapPin, ExternalLink, Download, Code, Palette, Settings, BookOpen, Github, Layers, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

const ResumePage = () => {
  // สร้าง Ref สำหรับควบคุมการเลื่อน Scroll (ใช้ React.useRef เพื่อความชัวร์)
  const scrollRef = React.useRef(null);

  // ฟังก์ชันสำหรับกดปุ่มเลื่อนซ้าย-ขวา
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      // คำนวณความกว้างของการ์ดใบแรกเพื่อเลื่อนทีละการ์ด
      const cardWidth = current.children[0].offsetWidth;
      // เพิ่ม gap (16px) เข้าไปในการคำนวณ
      const scrollAmount = direction === 'left' ? -(cardWidth + 16) : (cardWidth + 16);
      
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // ข้อมูลจาก Resume
  const profile = {
    name: "WARAWUT CHUMMONGKHON",
    role: "Frontend Developer & Graphic Designer",
    contact: {
      email: "wara.chu@hotmail.com",
      phone: "065-008-5050",
      location: "Bangkok, Thailand",
    },
    about: "Frontend Developer with a background in Graphic Design. Experienced in optimizing websites for SEO, performance, and UX/UI. Proven track record at KASIKORNBANK Head Office improving site traffic and operational efficiency.",
    education: {
      degree: "Bachelor's Degree in Business Computer",
      institution: "Western University",
      year: "2019 - 2022",
      gpa: "3.04"
    }
  };

  const skills = {
    frontend: ["HTML5", "CSS3", "JavaScript", "jQuery", "Bootstrap", "JSON", "Tailwind CSS", "SEO"],
    design: ["Figma", "Photoshop", "Illustrator", "Lightroom", "Adobe XD"],
    tools: ["WordPress", "SharePoint", "Bootstrap Studio", "Trello", "AI Tools", "GA4 (Basic)", "GTM (Basic)", "Ahrefs (Basic)"],
    learning: ["Next.js", "React", "Git", "Advanced JS Practices"]
  };

  const experiences = [
    {
      role: "FRONTEND DEVELOPER (Contract)",
      company: "Progress HR Co., Ltd. At KASIKORNBANK Head Office",
      period: "Dec 2023 - Present",
      achievements: [
        "Managed Technical SEO: Optimized sitemap, metadata, semantic HTML for Vietnam site.",
        "Frontend Optimization: Enhanced site speed and UX using SharePoint and Bootstrap.",
        "System Integration: Developed a standardized lead form system to replace manual processes.",
        "Design System: Built a reusable UI component library.",
        "SEO Growth: Achieved sustained uplift in organic clicks/impressions (Google Search Console).",
        "Operational Efficiency: Reduced lead drop-offs via automated lead capture workflow."
      ]
    },
    {
      role: "GRAPHIC DESIGN (Contract)",
      company: "Progress HR Co., Ltd. At KASIKORNBANK Head Office",
      period: "Jul 2023 - Nov 2023",
      achievements: [
        "Produced marketing assets for bank campaigns (banners, posters, social media).",
        "Developed reusable templates and asset libraries for consistent branding.",
        "Conducted creative research to adapt international design trends to local markets.",
        "Delivered high-quality print materials like brochures and manuals."
      ]
    },
    {
      role: "FREELANCE Web & Graphic Designer",
      company: "Freelance",
      period: "Jan 2021 - Jul 2023",
      achievements: [
        "Designed and launched custom WordPress websites.",
        "Created digital and print marketing materials for SMEs.",
        "Delivered end-to-end photography services including editing and retouching."
      ]
    }
  ];

  // เพิ่มข้อมูลส่วน Portfolio (ตัวอย่าง)
  const projects = [
    {
      title: "Corporate Website Redesign",
      description: "Modernized a legacy corporate website using Next.js and Tailwind CSS, improving page load speed by 40%.",
      tags: ["Next.js", "Tailwind", "Framer Motion"],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3",
      links: {
        demo: "#",
        github: "#"
      }
    },
    {
      title: "E-commerce Dashboard",
      description: "Responsive admin dashboard for tracking sales and inventory with data visualization charts.",
      tags: ["React", "Chart.js", "Material UI"],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2370&ixlib=rb-4.0.3",
      links: {
        demo: "#",
        github: "#"
      }
    },
    {
      title: "Interactive Campaign Landing Page",
      description: "High-conversion landing page with scroll animations and integrated lead capture forms.",
      tags: ["HTML5", "SCSS", "GSAP"],
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=2370&ixlib=rb-4.0.3",
      links: {
        demo: "#",
        github: "#"
      }
    },
    {
      title: "Portfolio V1 (WordPress)",
      description: "Previous portfolio site built with custom WordPress theme and PHP functions.",
      tags: ["WordPress", "PHP", "jQuery"],
      image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=2426&ixlib=rb-4.0.3",
      links: {
        demo: "#",
        github: "#"
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
      <style>{`
        /* ซ่อน Scrollbar แต่ยังเลื่อนได้ */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header / Hero Section */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="font-bold text-xl tracking-tight text-slate-900">WC.</h1>
          <a href="https://dabi-w.github.io/wara-nextjs-portfolio/CV-Warawut-Chummongkhon.pdf" target="_blank" rel="noopener noreferrer" download className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-700 transition text-sm font-medium shadow-md hover:shadow-lg">
            <Download size={20} />
            <span>Download CV</span>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar (Profile & Skills) */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-50 shadow-inner">
                   <img 
                    src="https://github.com/DABi-W/wara-nextjs-portfolio/blob/main/public/wara-profile.jpg?raw=true" 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                   />
                </div>
                <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
              <p className="text-blue-600 font-medium mb-4">{profile.role}</p>
              
              <div className="flex flex-col gap-2 text-sm text-slate-600 text-left mt-6 bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Mail size={16} className="text-slate-400 flex-shrink-0" />
                  <a href={`mailto:${profile.contact.email}`} className="hover:text-blue-600 transition truncate">{profile.contact.email}</a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-slate-400 flex-shrink-0" />
                  <span>{profile.contact.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                  <span>{profile.contact.location}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <a href="#" className="flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 transition">
                    <Github size={20}/>
                    <span className="font-medium">github.com/warawut</span>
                </a>
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Code size={20} className="text-blue-600" /> Technical Skills
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Frontend</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.frontend.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <hr className="border-gray-100"/>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Design</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.design.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                 <hr className="border-gray-100"/>

                {/* แยก Tools */}
                <div>
                   <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tools</h4>
                   <div className="flex flex-wrap gap-2">
                    {skills.tools.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <hr className="border-gray-100"/>

                {/* แยก Learning */}
                <div>
                   <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Learning</h4>
                   <div className="flex flex-wrap gap-2">
                    {skills.learning.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Education */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" /> Education
              </h3>
              <div>
                <h4 className="font-semibold text-slate-900">{profile.education.degree}</h4>
                <p className="text-slate-600">{profile.education.institution}</p>
                <div className="flex justify-between items-center mt-2 text-sm text-slate-500">
                  <span>{profile.education.year}</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">GPA {profile.education.gpa}</span>
                </div>
              </div>
            </div>

          </aside>

          {/* Right Content */}
          <section className="lg:col-span-8 space-y-8">
            
            {/* About Me */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
               <h3 className="text-xl font-bold mb-3 text-slate-900">About Me</h3>
               <p className="text-slate-600 leading-relaxed">
                 {profile.about}
               </p>
            </div>

            {/* Featured Projects (Carousel Style) */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Layers size={24} className="text-blue-600"/>
                        Featured Projects
                    </h3>
                    {/* Navigation Buttons */}
                    <div className="hidden sm:flex gap-2">
                        <button 
                            onClick={() => scroll('left')}
                            className="p-2 rounded-full bg-white border border-gray-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={() => scroll('right')}
                            className="p-2 rounded-full bg-white border border-gray-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm"
                            aria-label="Next slide"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
                
                {/* Carousel Container */}
                <div 
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar scroll-smooth"
                >
                    {projects.map((project, index) => (
                        <div key={index} className="min-w-full md:min-w-[calc(50%-8px)] snap-start">
                            <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col">
                                {/* Project Image */}
                                <div className="h-48 overflow-hidden relative bg-gray-200">
                                    <img src={project.image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h4 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">{project.title}</h4>
                                    <p className="text-slate-600 text-sm mb-4 flex-1 line-clamp-3">{project.description}</p>
                                    
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {project.tags.map(tag => (
                                            <span key={tag} className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">{tag}</span>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-auto">
                                        <a href={project.links.demo} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                                            <ArrowUpRight size={16} /> Live Demo
                                        </a>
                                        <a href={project.links.github} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 text-sm font-medium py-2 rounded-lg transition-colors">
                                            <Github size={16} /> Code
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Work Experience */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-900 px-2">Work Experience</h3>
              
              {experiences.map((exp, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-2">
                    <div>
                      <h4 className="text-lg font-bold text-blue-700">{exp.role}</h4>
                      <p className="font-medium text-slate-800">{exp.company}</p>
                    </div>
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-lg font-medium whitespace-nowrap">
                      {exp.period}
                    </span>
                  </div>
                  
                  <ul className="space-y-2 mt-4">
                    {exp.achievements.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-slate-600">
                        <span className="mt-2 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

          </section>
        </div>
        
        {/* Footer */}
        <footer className="mt-16 text-center text-slate-400 text-sm py-8 border-t border-gray-200">
          <p>© {new Date().getFullYear()} Warawut Chummongkhon. Built with Next.js & Tailwind CSS.</p>
        </footer>
      </main>
    </div>
  );
};

export default ResumePage;