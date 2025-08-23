import React from 'react'
import { useState } from 'react'
import inspections from '../../constants/inspections.json'
import { useParams } from 'react-router'
import { useEffect } from 'react'
import { Image, Eye, Trash2 } from 'lucide-react'

const Head = () => {

    const { id } = useParams();
    const inspection = inspections.find(inspection => inspection.inspec_no === id);

    const [time, setTime] = useState(new Date());

    useEffect(() => {
            const interval = setInterval(() => {
                setTime(new Date());
            }, 60000);
    
            return () => clearInterval(interval);
            }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending":
                return "border-red-400 bg-red-300 text-red-800 ";
            case "In progress":
                return "border-blue-400 bg-blue-300 text-blue-800";
            case "Completed":
                return "border-green-400 bg-green-300 text-green-800";
            default:
                return "border-gray-400 bg-gray-300 text-gray-800";
        }
    };

    return (
        <div>
            
        </div>
    )
}

export default Head
