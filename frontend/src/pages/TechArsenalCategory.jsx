import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { techArsenalTools } from '../data/techArsenalTools';

const TechArsenalCategory = () => {
    const { categoryId } = useParams();

    // Find the tool in the data
    const tool = techArsenalTools.find(t => t.name.toLowerCase().replace(/\s+/g, '-') === categoryId);

    // Default values if tool not found or slug doesn't match
    const categoryName = tool ? tool.name : (categoryId ? categoryId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown Category');
    const CategoryIcon = tool ? tool.icon : FiAlertCircle;
    const gradientColor = tool ? tool.color : "from-primary-500 to-purple-600";

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-night-950 transition-colors duration-200 font-sans">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Link to="/tech-arsenal" className="inline-flex items-center text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors font-medium">
                    <FiArrowLeft className="mr-2" /> Back to Tech Arsenal
                </Link>

                <div className="bg-white dark:bg-night-900 border border-gray-100 dark:border-night-800 rounded-2xl p-12 text-center shadow-sm max-w-2xl mx-auto relative overflow-hidden">
                    {/* Background glow */}
                    <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${gradientColor}`}></div>

                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradientColor} flex items-center justify-center mx-auto mb-8 shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300`}>
                        <CategoryIcon className="w-12 h-12 text-white" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
                        {categoryName}
                    </h1>

                    {tool && (
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            {tool.desc}
                        </p>
                    )}

                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/20 rounded-lg p-4 mb-8 inline-block max-w-md">
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium flex items-center gap-2">
                            Service available to public as soon as possible
                        </p>
                    </div>

                    <div>
                        <Link
                            to="/chat"
                            className={`inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r ${gradientColor} hover:opacity-90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
                        >
                            Explore Chat Features
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechArsenalCategory;
