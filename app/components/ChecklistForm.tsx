'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Camera, Mail, Save, Edit } from 'lucide-react';
import jsPDF from 'jspdf';
import emailjs from '@emailjs/browser';

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

const ChecklistForm = () => {
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

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Electromechanical Checklist', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('(Temp, Humidity, Noise & Lux)', 105, 30, { align: 'center' });
    
    doc.text(`Date: ${date}`, 20, 40);
    doc.text(`Shift: ${shift}`, 120, 40);
    
    let y = 60;
    
    // Primary Water Temperature Section
    doc.text('PRIMARY WATER TEMPERATURE', 20, y);
    y += 10;
    doc.text(`Chilled Water Supply: ${formData.primaryWater.chilledWaterSupply.reading1} / ${formData.primaryWater.chilledWaterSupply.reading2}`, 20, y);
    y += 10;
    doc.text(`Chilled Water Return: ${formData.primaryWater.chilledWaterReturn.reading1} / ${formData.primaryWater.chilledWaterReturn.reading2}`, 20, y);
    y += 10;
    doc.text(`MCF-01: ${formData.primaryWater.mcf01Supply.reading1}  MCF-04: ${formData.primaryWater.mcf04Supply.reading1}`, 20, y);
    
    y += 20;
    
    // Readings Table
    Object.entries(locationsByLevel).forEach(([level, locations]) => {
      doc.text(level, 20, y);
      y += 10;
      
      locations.forEach((location) => {
        const reading = formData.readings.find(r => r.location === location);
        if (reading) {
          doc.text(`${location}:`, 30, y);
          doc.text(`${reading.group1.temp}°C / ${reading.group1.rh}% / ${reading.group1.noise}dB / ${reading.group1.lux}lux`, 120, y);
          y += 8;
          doc.text(`${reading.group2.temp}°C / ${reading.group2.rh}% / ${reading.group2.noise}dB / ${reading.group2.lux}lux`, 120, y);
          y += 10;
        }
      });
      
      y += 10;
    });
    
    return doc;
  };

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

  const handleSave = () => {
    if (!date || !shift) {
      alert('Please select date and shift before saving');
      return;
    }
    localStorage.setItem(`checklist-${date}-${shift}`, JSON.stringify(formData));
    alert('Progress saved successfully');
  };

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

  return (
    <div className="max-w-[1200px] mx-auto p-4">
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>PRIMARY WATER TEMPERATURE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
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
              <div>MCF - 01(1600) Supply</div>
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
              <div className="font-medium">MCF - 04(1800) Supply</div>
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
        </CardContent>
      </Card>

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
                  {locations.map((location) => {
                    const index = flatLocations.indexOf(location);
                    return (
                      <tr key={location}>
                        <td className="border p-2 text-center">{index + 1}</td>
                        <td className="border p-2">{location}</td>
                        <td className="border p-2">
                          <input
                            type="number"
                            step="0.1"
                            className="w-full p-1"
                            value={formData.readings[index].group1.temp}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[index] = {
                                ...newReadings[index],
                                group1: {
                                  ...newReadings[index].group1,
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
                            value={formData.readings[index].group1.rh}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[index] = {
                                ...newReadings[index],
                                group1: {
                                  ...newReadings[index].group1,
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
                            value={formData.readings[index].group1.noise}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[index] = {
                                ...newReadings[index],
                                group1: {
                                  ...newReadings[index].group1,
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
                            value={formData.readings[index].group1.lux}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[index] = {
                                ...newReadings[index],
                                group1: {
                                  ...newReadings[index].group1,
                                  lux: e.target.value
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
                            value={formData.readings[index].group2.temp}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[index] = {
                                ...newReadings[index],
                                group2: {
                                  ...newReadings[index].group2,
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
                            value={formData.readings[index].group2.rh}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[index] = {
                                ...newReadings[index],
                                group2: {
                                  ...newReadings[index].group2,
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
                            value={formData.readings[index].group2.noise}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[index] = {
                                ...newReadings[index],
                                group2: {
                                  ...newReadings[index].group2,
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
                            value={formData.readings[index].group2.lux}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[index] = {
                                ...newReadings[index],
                                group2: {
                                  ...newReadings[index].group2,
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
                            value={formData.readings[index].remark}
                            onChange={(e) => {
                              const newReadings = [...formData.readings];
                              newReadings[index] = {
                                ...newReadings[index],
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
    </div>
  );
};

export default ChecklistForm;
