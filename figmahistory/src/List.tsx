import React, { useEffect, useState } from 'react';
import { Page } from './types';

interface ListProps {
    pageList: Page[] | undefined;
    onSelectionChange: (selectedItem: Page) => void;
    selectedItem?: Page | null;
    selectedItemId: string | undefined;
    selectedVersionNameLeft: string | undefined;
    selectedVersionNameRight: string | undefined;
}

const List: React.FC<ListProps> = (props) => {
    const [localSelectedItem, setLocalSelectedItem] = useState<Page | null>(null);

    const handleItemClick = (item: Page) => {
        if (item != props.selectedItem) {
            setLocalSelectedItem(item);
            props.onSelectionChange(item);
        }
    };

    useEffect(() => {
        if (props.selectedItemId && props.pageList) {
            const selectedPage = props.pageList.find(page => page.id == props.selectedItemId);
            if (selectedPage) setLocalSelectedItem(selectedPage);
        }

    }, [props.selectedItemId, props.pageList]);


    return (
        (props.pageList ?
            <div className='rowAvailable scrollable'>
                <ul>
                    {props.pageList.map((page) => (
                        <li key={page.id} className={`listItem ${(localSelectedItem?.id === page.id) ? 'selected' : ''}`}
                            onClick={() => handleItemClick(page)}
                        >
                            <div className="verticalLayout">
                                <div className="rowAuto">
                                    {page.name}
                                </div>
                                {page.presentInVersionLeft && page.presentInVersionRight && (page.name != page.nameOtherVersion) ? (
                                    <div className='rowAuto secondaryText'>
                                        ('{page.nameOtherVersion}' on right version)
                                    </div>
                                ) : ""}
                                {page.presentInVersionLeft && !page.presentInVersionRight ? (
                                    <div className='rowAuto secondaryText'>
                                        (Only present in left version)
                                    </div>
                                ) : ""}
                                {!page.presentInVersionLeft && page.presentInVersionRight ? (
                                    <div className='rowAuto secondaryText'>
                                        (Only present in right version)
                                    </div>
                                ) : ""}

                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            : <div></div>)
    );
};

export default List;

