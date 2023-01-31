import { mount } from 'enzyme';
import { waitFor } from '@testing-library/react';
import WorkspaceAccounts from './views/workspace-accounts';
import * as apiUtils from './util/api';
import * as authUtils from './util/auth';
import { BrowserRouter } from 'react-router-dom';

const tableData = [
    {
        "nih_funded_award_number": "1U2CDA050098-01",
        "request_status": "failed",
        "workspace_type": "STRIDES Credits",
        "total-usage": 0,
        "strides-credits": 250,
        "soft-limit": 130,
        "hard-limit": 225,
        "bmh_workspace_id": "13f9765f-e515-4349-909c-14223418132a",
    },
    {
        "hard-limit": 150,
        "nih_funded_award_number": "1U2CDA350098-01",
        "bmh_workspace_id": "13f9765f-e515-4a49-909c-14223418132a",
        "total-usage": 0,
        "request_status": "success",
        "soft-limit": 100,
        "strides-credits": 250,
        "workspace_type": "STRIDES Credits"
    }
];
const formattedData = {
    "hard-limit": "$225",
    "nih_funded_award_number": "1U2CDA050098-01",
    "total-usage": "$0",
    "request_status": "Failed",
    "soft-limit": "$130",
    "strides-credits": "$250",
    "workspace_type": "STRIDES Credits"
}

const columns = [
    {
        dataField: 'nih_funded_award_number',
        text: 'NIH Award/Grant ID',
        editable: false
    },
    {
        dataField: 'request_status',
        text: 'Request Status',
        editable: false,
    },
    {
        dataField: 'workspace_type',
        text: 'Workspace Type',
        editable: false
    },
    {
        dataField: 'total-usage',
        text: 'Total Usage',
        editable: false,
    },
    {
        dataField: 'strides-credits',
        text: 'Strides Credits',
        editable: false,
    },
    {
        dataField: 'soft-limit',
        text: 'Soft Limit',
        editable: true,
    },
    {
        dataField: 'hard-limit',
        text: 'Hard Limit',
        editable: true,
    },
    {
        dataField: 'access-link',
        text: 'Workspaces Link',
        editable: false,
        isDummyField: true
    }
]
const NUMBER_OF_COLUMNS = 8
process.env.REACT_APP_OIDC_AUTH_URI = "https://fence.planx-pla.net/user/oauth2/authorize"

const mountAccountsWrapper = (tableData) => {
    jest.spyOn(apiUtils, 'getWorkspaces').mockImplementation((callback) => { callback(tableData) });
    jest.spyOn(authUtils, 'authorizeAdmin').mockResolvedValue(true);
    return mount(
        <BrowserRouter>
            <WorkspaceAccounts />
        </BrowserRouter>
    );
}

it('renders WorkspaceAccounts table with no data', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper([]);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    await waitFor(() => {
        expect(table).toHaveLength(1);
    });
    expect(table.find('p').text()).toBe("No active workspaces to view.");
});


it('renders workspaceAccounts table which has specific number of rows', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    await waitFor(() => {
        expect(rows).toHaveLength(tableData.length);
    });
});

it('verifies all the column headers are appearing correctly.', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const headers = table.find('th');
    await waitFor(() => {
        headers.forEach((header, index) => {
            expect(header.text().trim()).toBe(columns[index]['text']);
        });
    });
});

it('verifies number of cells in a row are equal to NUMBER_OF_COLUMNS', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    const firstRowCells = rows.first().find('Cell');
    await waitFor(() => {
        expect(firstRowCells).toHaveLength(NUMBER_OF_COLUMNS);
    });
});

it('verifies the values in each column are displayed correctly with formatting', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    const firstRowCells = rows.first().find('Cell');

    await waitFor(() => {
        columns.filter((column) => !column['isDummyField']).forEach((column) => {
            const cell = firstRowCells.find({ "column": column });
            expect(cell.text()).toBe(formattedData[column.dataField]);
        })
    });
});

it('verifies the editability of each cell according to the defined columns', async () => {
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    const firstRowCells = rows.first().find('Cell');

    await waitFor(() => {
        columns.forEach((column) => {
            const cell = firstRowCells.find({ "column": column });
            expect(cell.prop('editable')).toBe(column['editable']);
        })
    });
});
//TODO: Need to implement the following test
// it('verifies the error message soft-limit is incorrect', async () => {
//     const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
//     const table = workspaceAccountsWrapper.find('BootstrapTable');
//     const rows = table.find('SimpleRow');
//     const firstRowCells = rows.first().find('Cell');

//     await waitFor(() => {
//         columns.forEach((column) => {
//             const cell = firstRowCells.find({ "column": column });
//             if(column['editable']){
//                 cell.find('td').simulate('click');
//                 workspaceAccountsWrapper.update();
//                 // td = cell.find('td.react-bootstrap-table-editing-cell')
//                 console.log(cell.debug());
//                 // td.simulate('change', {
//                 //     target : { value : 230}
//                 // });
//                 // console.log(firstRowCells.find({ "column": column }).debug());
//             }
//             expect(cell.prop('editable')).toBe(column['editable']);
//         })
//     });
// });
