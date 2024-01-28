import React, { useEffect, useState } from 'react';
import { Page } from './types';

interface ListProps {
    versionLeftPages: Page[] | undefined;
    versionRightPages: Page[] | undefined;
    onSelectionChange: (selectedItem: Page) => void;
    selectedItem?: Page | null;
}

const List: React.FC<ListProps> = (props) => {
    const [localSelectedItem, setLocalSelectedItem] = useState<Page | null>(null);
    const [localPages, setLocalPages] = useState<Page[] | null>(null);

    function mergePagesPreservingOrder(array1: Page[], array2: Page[]): Page[] {
        const mergedArray: Page[] = [];

        function addPage(page: Page, presentInVersionLeft: boolean, presentInVersionRight: boolean, secondName: string) {
            const newPage: Page = {
                id: page.id,
                children: page.children,
                name: page.name,
                nameOtherVersion: secondName,
                backgroundColor: page.backgroundColor,
                presentInVersionLeft: presentInVersionLeft,
                presentInVersionRight: presentInVersionRight,
                flatNodes: page.flatNodes,
                boundingRect: page.boundingRect
            };
            mergedArray.push(newPage);
        }

        for (const page of array1) {
            const array2Page = array2.find(page2 => page.id === page2.id);
            if (array2Page)
                addPage(page, true, true, array2Page.name);
            else
                addPage(page, true, false, "");
        }


        for (const page of array2) {
            if (!array1.some(page1 => page.id === page1.id))
                addPage(page, false, true, "");
        }

        return mergedArray;
    }

    const handleItemClick = (item: Page) => {
        if (item != props.selectedItem) {
            setLocalSelectedItem(item);
            props.onSelectionChange(item);
        }
    };

    useEffect(() => {
        if (props.versionLeftPages && props.versionRightPages)
            setLocalPages(mergePagesPreservingOrder(props.versionLeftPages, props.versionRightPages));
        else if (props.versionLeftPages)
            setLocalPages(props.versionLeftPages);
        else if (props.versionRightPages)
            setLocalPages(props.versionRightPages);

    }, [props.versionLeftPages, props.versionRightPages]);

    useEffect(() => {
        if (props.selectedItem !== undefined) {
            setLocalSelectedItem(props.selectedItem);
        }
    }, [props.selectedItem]);

    return (
        (localPages ?
            <ul>
                {localPages.map((page) => (
                    <li key={page.id} className={`listItem ${(localSelectedItem === page) ? 'selected' : ''}`}
                        onClick={() => handleItemClick(page)}
                    >
                        <div className="verticalLayout">
                            <div className="rowAuto">
                                {page.name}
                            </div>
                            {page.name != page.nameOtherVersion && page.nameOtherVersion != "" ? (
                                <div className='rowAuto secondaryText'>
                                    ( {page.nameOtherVersion})
                                </div>
                            ) : ""}
                            {page.presentInVersionLeft && !page.presentInVersionRight ? (
                                <div className='rowAuto primaryText'>
                                    🌟 Just in vLeft
                                </div>
                            ) : ""}
                            {!page.presentInVersionLeft && page.presentInVersionRight ? (
                                <div className='rowAuto primaryText'>
                                    🌟 Just in vRight
                                </div>
                            ) : ""}
                        </div>
                    </li>
                ))}
            </ul>
            : <div></div>)
    );
};

export default List;

