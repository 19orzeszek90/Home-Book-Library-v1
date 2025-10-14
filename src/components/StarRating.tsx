import React, { useMemo } from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
}

const generateId = () => `grad_${Math.random().toString(36).substring(2, 9)}`;

const Star: React.FC<{ fillPercentage: number; id: string }> = ({ fillPercentage, id }) => {
    const fill = Math.max(0, Math.min(100, fillPercentage));
    const filledColor = '#FBBF24'; // Tailwind's amber-400
    
    return (
        <svg
            className="w-4 h-4 text-gray-500 flex-shrink-0"
            fill={`url(#${id})`}
            viewBox="0 0 20 20"
        >
            <defs>
                <linearGradient id={id}>
                    <stop offset={`${fill}%`} stopColor={filledColor} />
                    <stop offset={`${fill}%`} stopColor="currentColor" />
                </linearGradient>
            </defs>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
};


const StarRating: React.FC<StarRatingProps> = ({ rating, maxRating = 5 }) => {
    const starIds = useMemo(() => 
        Array.from({ length: maxRating }, () => generateId()), 
    [maxRating]);

    return (
        <div className="flex items-center">
        {[...Array(maxRating)].map((_, index) => {
            const starValue = index + 1;
            let fillPercentage = 0;
            if (rating >= starValue) {
                fillPercentage = 100;
            } else if (rating > index) {
                fillPercentage = (rating - index) * 100;
            }
            return <Star key={index} id={starIds[index]} fillPercentage={fillPercentage} />;
        })}
        </div>
    );
};

export default StarRating;