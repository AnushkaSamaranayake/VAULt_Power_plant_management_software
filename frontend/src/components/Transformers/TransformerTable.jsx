import React from "react";
import { useEffect,useState } from "react";

const TransformerTable = ({ activeTable }) => {

    const [transformers, setTransformers] = useState([]);
    const [inspections, setInspections] = useState([]);

    useEffect(() => {
        // Fetch Table 1 data
        fetch("http://localhost:5000/api/transformers")
            .then((res) => res.json())
            .then((data) => setTransformers(data))
            .catch((err) => console.error("Error fetching table transformers:", err));

        // Fetch Table 2 data
        fetch("http://localhost:5000/api/inspections")
            .then((res) => res.json())
            .then((data) => setInspections(data))
            .catch((err) => console.error("Error fetching table inspections:", err));
    }, []);

    return (
        <div className="mx-5 mt-10">
        {activeTable === "transformers" && (
            <table className="border-collapse border border-gray-400 w-full">
            <thead>
                <tr>
                <th className="border p-2">ID</th>
                <th className="border p-2">Name</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                <td className="border p-2">1</td>
                <td className="border p-2">Alice</td>
                </tr>
                <tr>
                <td className="border p-2">2</td>
                <td className="border p-2">Bob</td>
                </tr>
            </tbody>
            </table>
        )}

        {activeTable === "inspections" && (
            <table className="border-collapse border border-gray-400 w-full">
            <thead>
                <tr>
                <th className="border p-2">Product</th>
                <th className="border p-2">Price</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                <td className="border p-2">Laptop</td>
                <td className="border p-2">$1000</td>
                </tr>
                <tr>
                <td className="border p-2">Phone</td>
                <td className="border p-2">$500</td>
                </tr>
            </tbody>
            </table>
        )}
        </div>
    );
};

export default TransformerTable;
