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
    readings: locationsByLevel.map(location => ({
      location,
      group1: { temp: '', rh: '', noise: '', lux: '' },
      group2: { temp: '', rh: '', noise: '', lux: '' },
      remark: ''
    }))
  });

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

  const handleEmailSend = async () => {
    if (!emailAddress) {
      alert('Please enter an email address');
      return;
    }
    
    const pdf = generatePDF();
    const pdfBase64 = pdf.output('datauristring');
    
    try {
      await emailjs.send(
        'YOUR_SERVICE_ID',
        'YOUR_TEMPLATE_ID',
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

  return (
    <div className="max-w-[1200px] mx-auto p-4">
      {/* Rest of your existing form code */}
      
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
    </div>
  );
};

export default ChecklistForm;
