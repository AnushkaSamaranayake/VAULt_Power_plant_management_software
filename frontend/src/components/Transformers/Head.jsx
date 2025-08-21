import React from 'react'

const Head = ({ activeTable, setActiveTable}) => {

    return (
        <div className='flex flex-row mx-5 mt-5 items-center justify-between'>
            <div className='flex flex-row'>
                <h2 className='text-xl font-semibold text-blue-800'>Transformer</h2>
                <button className='ml-5 px-4 py-1 bg-blue-500 text-white rounded-lg text-sm' onClick={() => navigate('#')}>Add transformer</button>
            </div>
            <div className='flex flex-row'>
                <button onClick={() => setActiveTable("transformers")} className={`px-4 py-1 ${activeTable === "transformers" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"} rounded-sm bg-blue-500 text-white text-sm shadow-md`}>Transformers</button>

                <button onClick={() => setActiveTable("inspections")} className={`px-4 py-1 ${activeTable === "inspections" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"} rounded-sm bg-blue-500 text-white text-sm shadow-md`}>Inspections</button>
            </div>
        </div>
  );
};

export default Head;
