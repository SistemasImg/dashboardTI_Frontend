import { useEffect, useRef, useState } from 'react';
import { getDigitalSignatureById } from '@/services/digitalSignature/getDigitalSignature';

const SIGNATURE_IMAGE_BY_NAME = {
  'Arnold Sotelo': 2,
};

const toImg360Proxy = (url) => {
  if (!url) return null;

  return url.replace(
    'https://img360.com/img/',
    'https://img360.com/media/proxy.php?file='
  );
};

export function PreviewIMG({ fullname, position, phoneNumber, email }) {
  const [logoImg, setLogoImg] = useState(null);
  const [certificationImg, setCertificationImg] = useState(null);
  const [loading, setLoading] = useState(true);

  const CANVAS_WIDTH = 1350;
  const CANVAS_HEIGHT = 442;

  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.9);

  useEffect(() => {
    async function loadImages() {
      try {
        setLoading(true);

        const dynamicImageId = SIGNATURE_IMAGE_BY_NAME[fullname] ?? 1;

        const [logo, certification] = await Promise.all([
          getDigitalSignatureById(4),
          getDigitalSignatureById(dynamicImageId),
        ]);

        setLogoImg(toImg360Proxy(logo?.url));
        setCertificationImg(toImg360Proxy(certification?.url));
      } catch (error) {
        console.error('Error loading digital signature images', error);
      } finally {
        setLoading(false);
      }
    }

    loadImages();
  }, [fullname]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;

        const nextScale = Math.min(width / CANVAS_WIDTH, 1);
        setScale(nextScale);
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[482px] items-center justify-center">
        Loading signature…
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      <div className="flex justify-center">
        <div
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          <div
            id="digital_signature"
            style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
            className="relative box-border bg-white text-left"
          >
            {/* LOGO */}

            <div className="flex items-center bg-white pb-3">
              <div className="ml-14 mt-28 flex w-2/12 justify-end">
                {logoImg && (
                  <img
                    src={logoImg}
                    crossOrigin="anonymous"
                    className="w-[230px]"
                    alt="Company Logo"
                  />
                )}
              </div>

              {/* DIVIDER */}
              <div className="ml-8 mr-10 mt-16 h-[300px] w-[4px] bg-[#EEA11D]" />

              {/* INFO */}
              <div className="w-3/4">
                <h2 className="mb-[-10px] mt-14 font-montserrat text-[70px] font-bold  tracking-tight text-gray-900">
                  {fullname}
                </h2>

                <h3 className="mb-4 font-montserrat text-4xl font-semibold italic text-[#EEA11D]">
                  {position}
                </h3>

                {/* CERTIFICATIONS */}
                <div className="flex">
                  {certificationImg && (
                    <img
                      src={certificationImg}
                      crossOrigin="anonymous"
                      className="mt-2 h-[140px]"
                      alt="Certifications"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end bg-white">
              <div className="relative mt-2 flex h-[60px] w-[1200px] items-center justify-between bg-[#EEA11D] px-24 py-2 text-[25px] font-semibold text-white">
                <span className="absolute left-2 top-2 h-28 w-16 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-br-3xl bg-white" />
                <span className="ml-10">Peru: {phoneNumber}</span>
                <span>{email}</span>
                <span className="mr-5">www.img360.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
