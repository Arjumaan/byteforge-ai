import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FiArrowRight } from 'react-icons/fi';
import { techArsenalTools } from '../data/techArsenalTools';

const TechArsenal = () => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-night-950 transition-colors duration-200 font-sans">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-600 to-indigo-600 tracking-tight mb-4 animate-fade-in-up">
                        Tech Arsenal
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed animate-fade-in-up delay-100">
                        Your centralized hub for <span className="font-bold text-primary-600 dark:text-primary-400">50+ cutting-edge AI tools</span>.
                        Automate, create, and innovate with the power of artificial intelligence.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {techArsenalTools.map((category, index) => (
                        <Link
                            key={index}
                            to={`/tech-arsenal/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="group relative bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Background Gradient Effect on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                        <category.icon className="w-6 h-6 text-white" />
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {category.name}
                                    </h3>

                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
                                        {category.desc}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50 dark:border-night-800">
                                    <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-night-800 px-2 py-1 rounded">
                                        AI Tool
                                    </span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 dark:bg-night-800 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-colors`}>
                                        <FiArrowRight className={`w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transform group-hover:translate-x-0.5 transition-all`} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TechArsenal;
