import React from 'react'
import AddTransformer from '../Transformers/AddTransformer';
import AddInspector from './AddInspector';
import { useState,useEffect } from 'react';

const Head = ({ activeTable, setActiveTable}) => {

    const [showAddTransformer, setShowAddTransformer] = useState(false);
    const [showAddInspection, setShowAddInspection] = useState(false);

    return (
        <div className='flex flex-row mx-5 mt-5 items-center justify-between'>
            <div className='flex flex-row'>
                <h2 className='text-xl font-semibold text-blue-800'>{activeTable === "transformers" ? "Transformers" : "Inspections"}</h2>
                {activeTable === "transformers" ? (
                    <button className='ml-5 px-4 py-1 bg-blue-500 text-white rounded-lg text-sm' onClick={() => setShowAddTransformer(true)}>Add transformer</button>
                ):(
                    <button className='ml-5 px-4 py-1 bg-blue-500 text-white rounded-lg text-sm' onClick={() => setShowAddInspection(true)}>Add Inspection</button>
                )}
            </div>
            <div className='flex flex-row'>
                <button onClick={() => setActiveTable("transformers")} className={`px-4 py-1 ${activeTable === "transformers" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"} rounded-sm bg-blue-500 text-white text-sm shadow-md`}>Transformers</button>

                <button onClick={() => setActiveTable("inspections")} className={`px-4 py-1 ${activeTable === "inspections" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"} rounded-sm bg-blue-500 text-white text-sm shadow-md`}>Inspections</button>
            </div>
            {showAddTransformer && <AddTransformer onClose={() => setShowAddTransformer(false)} />}
            {showAddInspection && <AddInspector onClose={() => setShowAddInspection(false)} />}
        </div>
  );
};

export default Head;
