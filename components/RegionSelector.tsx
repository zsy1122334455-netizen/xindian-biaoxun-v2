import React, { useState } from 'react';
import { REGIONS } from '../src/constants/regions';

interface Props {
  initialRegion: { province: string; cities: string[] };
  onClose: () => void;
  onConfirm: (region: { province: string; cities: string[] }) => void;
}

export const RegionSelector: React.FC<Props> = ({ initialRegion, onClose, onConfirm }) => {
  const [selectedRegion, setSelectedRegion] = useState<{ province: string; cities: string[] }>(
    initialRegion || { province: '全国', cities: [] }
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#F7F8FA] animate-in slide-in-from-bottom-full">
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <button className="text-gray-500 font-medium text-[15px]" onClick={onClose}>取消</button>
        <div className="font-bold text-[16px] text-gray-900">选择地区</div>
        <button 
          className="text-[#1677FF] font-medium text-[15px]" 
          onClick={() => onConfirm(selectedRegion)}
        >
          确定
        </button>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/3 bg-[#F7F8FA] overflow-y-auto pb-safe">
          <button 
            className={`w-full text-center px-4 py-4 text-[15px] ${selectedRegion.province === '全国' ? 'bg-white text-[#1677FF] font-medium' : 'text-gray-600'}`}
            onClick={() => setSelectedRegion({ province: '全国', cities: [] })}
          >
            全国
          </button>
          {REGIONS.map(r => (
            <button 
              key={r.name}
              className={`w-full text-center px-4 py-4 text-[15px] ${selectedRegion.province === r.name ? 'bg-white text-[#1677FF] font-medium' : 'text-gray-600'}`}
              onClick={() => setSelectedRegion({ province: r.name, cities: [] })}
            >
              {r.name}
            </button>
          ))}
        </div>
        <div className="w-2/3 overflow-y-auto bg-white pb-safe">
          {selectedRegion.province === '全国' ? (
            <button 
              className="w-full text-left px-6 py-4 text-[15px] flex justify-between items-center text-[#1677FF]"
              onClick={() => setSelectedRegion({ province: '全国', cities: [] })}
            >
              全国
              <div className="w-5 h-5 rounded-full bg-[#1677FF] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ) : (
            REGIONS.find(r => r.name === selectedRegion.province)?.cities.map(city => (
              <button 
                key={city}
                className={`w-full text-left px-6 py-4 text-[15px] flex justify-between items-center ${selectedRegion.cities.includes(city) ? 'text-[#1677FF]' : 'text-gray-800'}`}
                onClick={() => {
                  const newCities = selectedRegion.cities.includes(city)
                    ? selectedRegion.cities.filter(c => c !== city)
                    : [...selectedRegion.cities, city];
                  setSelectedRegion({ ...selectedRegion, cities: newCities });
                }}
              >
                {city}
                {selectedRegion.cities.includes(city) && (
                  <div className="w-5 h-5 rounded-full bg-[#1677FF] flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
      
      {/* Selected tags */}
      <div className="bg-white border-t border-gray-100 flex flex-col pb-safe mb-4">
        <div className="px-4 py-3 flex items-center gap-2">
          <span className="text-[13px] text-gray-500 shrink-0">已选:</span>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-none">
            {selectedRegion.province === '全国' ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-[#F0F5FF] text-[#1677FF] rounded text-[13px]">
                全国
              </div>
            ) : (
              selectedRegion.cities.length > 0 ? selectedRegion.cities.map(city => (
                <div key={city} className="flex items-center gap-1 px-2 py-1 bg-[#F0F5FF] text-[#1677FF] rounded text-[13px] whitespace-nowrap">
                  {city}
                </div>
              )) : (
                <div className="flex items-center gap-1 px-2 py-1 bg-[#F0F5FF] text-[#1677FF] rounded text-[13px]">
                  {selectedRegion.province}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
