import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Camera, Mail, Save, Edit } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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

  const doc = await generatePDF();
  if (doc) {
    const pdfBase64 = await new Promise(resolve => {
      doc.output('datauristring', (data) => {
        resolve(data.split(',')[1]);
      });
    });

    const doc = new jsPDF();
    
    // Add logos
    const initialLogoImg = await fetch('initial-logo.png').then(res => res.blob()).then(blob => blob2dataURL(blob));
    const riyadhLogoImg = await fetch('riyadh-airports-logo.png').then(res => res.blob()).then(blob => blob2dataURL(blob));
    doc.addImage(initialLogoImg, 'PNG', 20, 15, 40, 15);
    doc.addImage(riyadhLogoImg, 'PNG', 150, 15, 40, 15);

    // Title
    doc.setFontSize(12);
    doc.text('Electromechanical Checklist', 105, 20, { align: 'center' });
    doc.text('(Temp, Humidity, Noise & Lux)', 105, 25, { align: 'center' });

    // Date at top right
    doc.text(date, 160, 35);

    // Primary Water Temperature section
    doc.text('PRIMARY WATER TEMPERATURE', 20, 40);
    doc.rect(20, 45, 170, 40);
    
    // Headers
    doc.text('(Plant Room - 1600)', 25, 50);
    doc.text('C Shift (°C)', 80, 50);
    doc.text('C Shift (°C)', 130, 50);
    doc.text('REMARK', 160, 50);

    // Water temperatures
    doc.text('CHILLED WATER SUPPLY TEMP.', 25, 60);
    doc.text(formData.primaryWater.chilledWaterSupply.reading1, 80, 60);
    doc.text(formData.primaryWater.chilledWaterSupply.reading2, 130, 60);
    
    doc.text('CHILLED WATER RETURN TEMP', 25, 70);
    doc.text(formData.primaryWater.chilledWaterReturn.reading1, 80, 70);
    doc.text(formData.primaryWater.chilledWaterReturn.reading2, 130, 70);

    doc.text('MCF - 01(1600) Supply', 25, 80);
    doc.text(formData.primaryWater.mcf01Supply.reading1, 80, 80);
    doc.text('MCF - 04(1800) Supply', 100, 80);
    doc.text(formData.primaryWater.mcf04Supply.reading1, 150, 80);

    // Main table
    const startY = 90;
    const rowHeight = 7;
    
    // Table headers
    const headers = ['SI No', 'LOCATION', 'Temp °C', 'RH (%)', 'Noise Rating (NR)', 'Lux', 'Temp °C', 'RH (%)', 'Noise Rating (NR)', 'Lux', 'REMARK'];
    
    // Draw table
    doc.rect(20, startY, 170, rowHeight);
    headers.forEach((header, i) => {
      doc.text(header, 25 + (i * 15), startY + 5);
    });

    let y = startY + rowHeight;
    
    // Data rows with level grouping
    Object.entries(locationsByLevel).forEach(([level, locations]) => {
      // Level header
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y, 170, rowHeight, 'F');
      doc.text(level, 25, y + 5);
      y += rowHeight;

      locations.forEach((location, index) => {
        const reading = formData.readings[flatLocations.indexOf(location)];
        
        doc.rect(20, y, 170, rowHeight);
        doc.text((index + 1).toString(), 25, y + 5);
        doc.text(location, 40, y + 5);
        doc.text(reading.group1.temp, 70, y + 5);
        doc.text(reading.group1.rh, 85, y + 5);
        doc.text(reading.group1.noise, 100, y + 5);
        doc.text(reading.group1.lux, 115, y + 5);
        doc.text(reading.group2.temp, 130, y + 5);
        doc.text(reading.group2.rh, 145, y + 5);
        doc.text(reading.group2.noise, 160, y + 5);
        doc.text(reading.group2.lux, 175, y + 5);
        
        y += rowHeight;
      });
    });

    // Signature line at bottom
    doc.line(20, y + 10, 190, y + 10);
    doc.text('Technician Name', 20, y + 20);

    return doc;
  };

  const handleEmailSend = async () => {
    if (!emailAddress) {
      alert('Please enter an email address');
      return;
    }
    
    const doc = await generatePDF();
    const pdfBase64 = await new Promise(resolve => {
      doc.output('datauristring', (data) => {
        resolve(data.split(',')[1]);
      });
    });
    
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
            onClick={() => generatePDF().then(doc => doc.save('checklist.pdf'))}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Download PDF
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
            {/* ... (rest of the component remains the same) */}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          {/* ... (rest of the component remains the same) */}
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
              onClick={() => generatePDF().then(doc => doc.save('checklist.pdf'))}
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

function blob2dataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(blob);
  });
}
