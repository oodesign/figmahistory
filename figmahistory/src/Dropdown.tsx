import React from 'react';
import Select, { components } from 'react-select';

// Custom Option component
const CustomOption = ({ innerProps, label, data }) => (
    <div {...innerProps} style={{ backgroundColor: data.color }}>
        {label} - {data.created_at}
    </div>
);

// Your component using React Select
const Dropdown = () => {
    const options = [
        { value: 'red', label: 'Red', color: 'red', created_at: 'today' },
        { value: 'green', label: 'Green', color: 'green', created_at: 'yesterday' },
        { value: 'blue', label: 'Blue', color: 'blue', created_at: 'yesterday' },
    ];

    const customComponents = {
        Option: CustomOption,
    };

    return (
        <Select
            options={options}
            components={customComponents}
        />
    );
};

export default Dropdown;
