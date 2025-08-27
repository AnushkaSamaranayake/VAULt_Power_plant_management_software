import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const RecentTransformers = () => {
  const navigate = useNavigate();
  const [recentTransformers, setRecentTransformers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8080/api/transformers')
      .then((response) => {
        // Get the most recent transformers (limit to 5)
        const transformers = response.data.slice(0, 5);
        setRecentTransformers(transformers);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching transformers:', error);
        setRecentTransformers([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mx-5 mt-10">
        <div className="grid grid-cols-4 gap-y-2 p-4 bg-gray-100 rounded-md mb-4">
            <div className="font-semibold">Transformer No</div>
            <div className="font-semibold">Region</div>
            <div className="font-semibold">Type</div>
            <div className="font-semibold">Pole No</div>
        </div>
        
        {loading ? (
          <div className="bg-white shadow rounded-md border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">Loading recent transformers...</p>
          </div>
        ) : recentTransformers && recentTransformers.length > 0 ? (
          recentTransformers.map((transformer) => (
            <div 
              key={transformer.transformerNo} 
              className="bg-white shadow rounded-md border border-gray-200 grid grid-cols-4 gap-y-2 p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/transformers/${transformer.transformerNo}`)}
            >
                <div className="text-xs">{transformer.transformerNo}</div>
                <div className="text-xs">{transformer.region}</div>
                <div className="text-xs">{transformer.type}</div>
                <div className="text-xs">{transformer.poleNo}</div>
            </div>
          ))
        ) : (
          <div className="bg-white shadow rounded-md border border-gray-200 p-8 text-center">
            <p className="text-gray-500 text-sm">No transformers found.</p>
          </div>
        )}
    </div>
  )
}

export default RecentTransformers;
