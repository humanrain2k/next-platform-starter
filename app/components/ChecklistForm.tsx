// PART 1: IMPORTS
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Camera, Mail, Save, Edit } from 'lucide-react';
import jsPDF from 'jspdf';
import emailjs from '@emailjs/browser';

// PART 2: INTERFACES
interface Reading {
  temp: string;
  rh: string;
  noise: string;
  lux: string;
}

interface LocationReading {
  location: string;
  group1: Reading;
  group2: Reading;
  remark: string;
}

// PART 3: LOCATIONS DATA
const locationsByLevel: { [key: string]: string[] } = {
  'LOWER LEVEL': [
    "Lower level entrance X-Ray Area",
    "East side VVIP sitting area",
    "West side VVIP sitting area",
    "Ladies Lounge",
    "Cafeteria Area",
    "Baggage Area",
    "Toilet Area",
    "Prayer Room",
    "Near Protocol Office",
    "Operation Office"
  ],
  'INTER LEVEL': [
    "Maintenance Office",
    "Corridor #1",
    "Corridor #2",
    "Data Room",
    "Near Suite #1"
  ],
  'PLAZA LEVEL': [
    "Near Suite #2",
    "Suite #2 Electrical Room",
    "Near Suite #3",
    "Suite #3 Electrical Room",
    "Conference Room",
    "Plaza Area 300",
    "Near East Jet Way",
    "Near West Jet Way",
    "Near Suite #4"
  ]
};

const allLocations = Object.entries(locationsByLevel).map(([level, locations]) => ({
  level,
  locations: locations as string[]
}));

const flatLocations = Object.values(locationsByLevel).flat();

// PART 4: MAIN COMPONENT
const ChecklistForm = () => {
  // PART 4.1: STATE DEFINITIONS
  const [emailAddress, setEmailAddress] = useState('');
  const [shift, setShift] = useState('');
  const [date, setDate] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [formData, setFormData] = useState({
    primaryWater: {
      chilledWaterSupply: { reading1: '', reading2: '' },
      chilledWaterReturn: { reading1: '', reading2: '' },
      mcf01Supply: { reading1: '' },
      mcf04Supply: { reading1: '' }
    },
    readings: flatLocations.map(location => ({
      location,
      group1: { temp: '', rh: '', noise: '', lux: '' },
      group2: { temp: '', rh: '', noise: '', lux: '' },
      remark: ''
    }))
  });

  // PART 4.2: COMPLETION CHECK EFFECT
  useEffect(() => {
    const checkCompletion = () => {
      // Check if at least one reading is filled
      const hasAnyReading = formData.readings.some(reading => 
        reading.group1.temp !== '' || 
        reading.group1.rh !== '' || 
        reading.group1.noise !== '' || 
        reading.group1.lux !== ''
      );
  
      setIsComplete(hasAnyReading);
    };
  
    checkCompletion();
  }, [formData]);

  // PART 4.3: PDF GENERATION
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Electromechanical Checklist', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('(Temp, Humidity, Noise & Lux)', 105, 30, { align: 'center' });
    
    // Add date and shift
    doc.text(`Date: ${date}`, 20, 40);
    doc.text(`Shift: ${shift}`, 120, 40);
    
    // Add primary water temperature section
    doc.text('PRIMARY WATER TEMPERATURE', 20, 50);
    
    // Add readings table
    let y = 70;
    doc.text('SI No', 20, y);
    doc.text('Location', 40, y);
    doc.text('Temp °C', 80, y);
    
    formData.readings.forEach((reading, index) => {
      y += 10;
      doc.text((index + 1).toString(), 20, y);
      doc.text(reading.location, 40, y);
      doc.text(reading.group1.temp.toString(), 80, y);
    });
    
    return doc;
  };

  // PART 4.4: EMAIL HANDLING
  const handleEmailSend = async () => {
    if (!emailAddress) {
      alert('Please enter an email address');
      return;
    }
    
    const pdf = generatePDF();
    const pdfBase64 = pdf.output('datauristring');
    
    try {
      await emailjs.send(
        'service_1csfpd8',
        'template_ISG-electromech',
        {
          to_email: emailAddress,
          pdf_attachment: pdfBase64,
          date: date,
          shift: shift,
        },
        '2L53_Rnsj4aeJ2LJH'
      );
      
      alert('Report sent successfully!');
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  // PART 4.5: DATA SAVING
  const handleSave = () => {
    if (!date || !shift) {
      alert('Please select date and shift before saving');
      return;
    }
    localStorage.setItem(`checklist-${date}-${shift}`, JSON.stringify(formData));
    alert('Progress saved successfully');
  };

  // PART 4.6: LOAD PREVIOUS DATA
  const loadPreviousData = () => {
    if (!date || !shift) {
      alert('Please select date and shift to load data');
      return;
    }
    const savedData = localStorage.getItem(`checklist-${date}-${shift}`);
    if (savedData) {
      setFormData(JSON.parse(savedData));
      alert('Previous data loaded');
    } else {
      alert('No saved data found for selected date and shift');
    }
  };

  // PART 4.7: COMPONENT RENDER
  return (
    <div className="max-w-[1200px] mx-auto p-4">
      {/* Header Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Date:</span>
              <input
                type="date"
                className="p-2 border rounded"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Shift:</span>
              <select 
                className="p-2 border rounded"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
              >
                <option value="">Select Shift</option>
                <option value="A">A Shift</option>
                <option value="B">B Shift</option>
                <option value="C">C Shift</option>
              </select>
            </div>
            <button
              onClick={loadPreviousData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Load Previous
            </button>
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Progress
            </button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Primary Water Temperature Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>PRIMARY WATER TEMPERATURE</CardTitle>
        </CardHeader>
        <CardContent>
<div className="grid gap-4">
  <div className="grid grid-cols-3 gap-4 border-b pb-4">
    <div className="font-medium">Plant Room - 1600</div>
    <div className="font-medium text-center">C Shift (°C)</div>
    <div className="font-medium text-center">C Shift (°C)</div>
  </div>
            
  <div className="grid grid-cols-4 gap-4">
    <div>CHILLED WATER SUPPLY TEMP.</div>
    <input
      type="number"
      step="0.01"
      className="p-2 border rounded"
      value={formData.primaryWater.chilledWaterSupply.reading1}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        primaryWater: {
          ...prev.primaryWater,
          chilledWaterSupply: {
            ...prev.primaryWater.chilledWaterSupply,
            reading1: e.target.value
          }
        }
      }))}
    />
    <input
      type="number"
      step="0.01"
      className="p-2 border rounded"
      value={formData.primaryWater.chilledWaterSupply.reading2}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        primaryWater: {
          ...prev.primaryWater,
          chilledWaterSupply: {
            ...prev.primaryWater.chilledWaterSupply,
            reading2: e.target.value
          }
        }
      }))}
    />
  </div>

  <div className="grid grid-cols-4 gap-4">
    <div>CHILLED WATER RETURN TEMP</div>
    <input
      type="number"
      step="0.01"
      className="p-2 border rounded"
      value={formData.primaryWater.chilledWaterReturn.reading1}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        primaryWater: {
          ...prev.primaryWater,
          chilledWaterReturn: {
            ...prev.primaryWater.chilledWaterReturn,
            reading1: e.target.value
          }
        }
      }))}
    />
    <input
      type="number"
      step="0.01"
      className="p-2 border rounded"
      value={formData.primaryWater.chilledWaterReturn.reading2}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        primaryWater: {
          ...prev.primaryWater,
          chilledWaterReturn: {
            ...prev.primaryWater.chilledWaterReturn,
            reading2: e.target.value
          }
        }
      }))}
    />
  </div>

  <div className="grid grid-cols-4 gap-4">
    <div>MCF - 01(1600) Supply Temperature</div>
    <input
      type="number"
      step="0.01"
      className="p-2 border rounded"
      value={formData.primaryWater.mcf01Supply.reading1}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        primaryWater: {
          ...prev.primaryWater,
          mcf01Supply: {
            ...prev.primaryWater.mcf01Supply,
            reading1: e.target.value
          }
        }
      }))}
    />
    <div className="font-medium">MCF - 04(1800) Supply Temperature</div>
    <input
      type="number"
      step="0.01"
      className="p-2 border rounded"
      value={formData.primaryWater.mcf04Supply.reading1}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        primaryWater: {
          ...prev.primaryWater,
          mcf04Supply: {
            ...prev.primaryWater.mcf04Supply,
            reading1: e.target.value
          }
        }
      }))}
    />
  </div>
</div>

      {/* Readings Table */}
      <Card className="mb-6">
        <CardContent>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2">SI No</th>
                <th className="border p-2">LOCATION</th>
                <th className="border p-2" colSpan={4}>First Reading</th>
                <th className="border p-2" colSpan={4}>Second Reading</th>
                <th className="border p-2">REMARK</th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border p-2"></th>
                <th className="border p-2"></th>
                <th className="border p-2">Temp °C</th>
                <th className="border p-2">RH (%)</th>
                <th className="border p-2">NR</th>
                <th className="border p-2">Lux</th>
                <th className="border p-2">Temp °C</th>
                <th className="border p-2">RH (%)</th>
                <th className="border p-2">NR</th>
                <th className="border p-2">Lux</th>
                <th className="border p-2"></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(locationsByLevel).map(([level, locations]) => (
                <React.Fragment key={level}>
                  <tr className="bg-gray-100">
                    <td className="border p-2 font-bold" colSpan={11}>{level}</td>
                  </tr>
                  {locations.map((location, locationIndex) => {
                    const globalIndex = flatLocations.indexOf(location);
                    return (
                      <tr key={location}>
                        <td className="border p-2 text-center">{globalIndex + 1}</td>
                        <td className="border p-2">{location}</td>
                        {/* First Reading Group */}
                        <td className="border p-2">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full p-1"
                            value={formData.readings[globalIndex].group1.temp}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[globalIndex] = {
                                ...newReadings[globalIndex],
                                group1: {
                                  ...newReadings[globalIndex].group1,
                                  temp: e.target.value
                                }
                              };
                              setFormData(prev => ({...prev, readings: newReadings}));
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full p-1"
                            value={formData.readings[globalIndex].group1.rh}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[globalIndex] = {
                                ...newReadings[globalIndex],
                                group1: {
                                  ...newReadings[globalIndex].group1,
                                  rh: e.target.value
                                }
                              };
                              setFormData(prev => ({...prev, readings: newReadings}));
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full p-1"
                            value={formData.readings[globalIndex].group1.noise}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[globalIndex] = {
                                ...newReadings[globalIndex],
                                group1: {
                                  ...newReadings[globalIndex].group1,
                                  noise: e.target.value
                                }
                              };
                              setFormData(prev => ({...prev, readings: newReadings}));
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            className="w-full p-1"
                            value={formData.readings[globalIndex].group1.lux}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[globalIndex] = {
                                ...newReadings[globalIndex],
                                group1: {
                                  ...newReadings[globalIndex].group1,
                                  lux: e.target.value
                                }
                              };
                              setFormData(prev => ({...prev, readings: newReadings}));
                            }}
                          />
                        </td>
                        {/* Second Reading Group */}
                        <td className="border p-2">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full p-1"
                            value={formData.readings[globalIndex].group2.temp}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[globalIndex] = {
                                ...newReadings[globalIndex],
                                group2: {
                                  ...newReadings[globalIndex].group2,
                                  temp: e.target.value
                                }
                              };
                              setFormData(prev => ({...prev, readings: newReadings}));
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full p-1"
                            value={formData.readings[globalIndex].group2.rh}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[globalIndex] = {
                                ...newReadings[globalIndex],
                                group2: {
                                  ...newReadings[globalIndex].group2,
                                  rh: e.target.value
                                }
                              };
                              setFormData(prev => ({...prev, readings: newReadings}));
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full p-1"
                            value={formData.readings[globalIndex].group2.noise}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[globalIndex] = {
                                ...newReadings[globalIndex],
                                group2: {
                                  ...newReadings[globalIndex].group2,
                                  noise: e.target.value
                                }
                              };
                              setFormData(prev => ({...prev, readings: newReadings}));
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            className="w-full p-1"
                            value={formData.readings[globalIndex].group2.lux}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[globalIndex] = {
                                ...newReadings[globalIndex],
                                group2: {
                                  ...newReadings[globalIndex].group2,
                                  lux: e.target.value
                                }
                              };
                              setFormData(prev => ({...prev, readings: newReadings}));
                            }}
                          />
                        </td>
                        <td className="border p-2">
                          <input
                            type="text"
                            className="w-full p-1"
                            value={formData.readings[globalIndex].remark}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[globalIndex] = {
                                ...newReadings[globalIndex],
                                remark: e.target.value
                              };
                              setFormData(prev => ({...prev, readings: newReadings}));
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Export Controls */}
      {isComplete && (
        <Card className="mt-6 print:hidden">
          <CardContent className="flex gap-4 justify-end p-4">
            <input
              type="email"
              placeholder="Enter email address"
              className="p-2 border rounded flex-grow"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
            />
            <button 
              onClick={handleEmailSend}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send Report
            </button>
            <button 
              onClick={() => generatePDF().save('checklist.pdf')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Download PDF
            </button>
          </CardContent>
        </Card>
      )}

      {/* Signature Area */}
      <div className="mt-8 print:mt-16">
        <div className="h-20 border-b border-dashed"></div>
        <div className="text-center mt-2">Signature</div>
      </div>
    </div>
  );
};

export default ChecklistForm;
