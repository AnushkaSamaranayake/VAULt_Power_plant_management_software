import React from 'react'

const AddInspector = ({onClose}) => {

    return (
        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50'>
            <div className={`p-6 rounded-2xl shadow-xl max-w-sm w-full bg-white`}>
                <form action="">
                    <h2 className='font-semibold text-lg mb-5'>Add Inspection</h2>
                    <div className="mb-4">
                        <label htmlFor="transformerName" className="block text-sm font-medium text-gray-700">Transformer No</label>
                        <input type="text" id="transformerName" name="transformerName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerType" className="block text-sm font-medium text-gray-700">Inspection No</label>
                        <input type="text" id="transformerType" name="transformerType" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="transformerRegion" className="block text-sm font-medium text-gray-700">Date</label>
                        <input type="datetime-local" id="transformerRegion" name="transformerRegion" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md mb-4">Add Inspection</button>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md" onClick={onClose}>Close</button>
                </form>
            </div>
        </div>
    )
}

export default AddInspector
