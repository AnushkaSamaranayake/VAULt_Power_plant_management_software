import React from 'react'
import { useNavigate } from 'react-router-dom';
import recentTransformers from '../../constants/recentTransformers.json';

const RecentTransformers = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-5 mt-10">
        <div className="grid grid-cols-4 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
            <div className="font-semibold">Transformer No</div>
            <div className="font-semibold">Date</div>
            <div className="font-semibold">Region</div>
            <div className="font-semibold">Type</div>
        </div>
        {recentTransformers.map((row) => (
            <div key={row.id} className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-4 gap-y-2 p-3">
                <div className="text-xs">{row.id}</div>
                <div className="text-xs">{row.add_date}</div>
                <div className="text-xs">{row.region}</div>
                <div className="text-xs">{row.type}</div>
            </div>
        ))}
    </div>
  )
}

export default RecentTransformers;
