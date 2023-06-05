import { mount } from 'enzyme';
import { waitFor } from '@testing-library/react';
import WorkspaceAccountsAdmin from './workspace-accounts-admin';
import * as apiUtils from '../util/api';
import * as authUtils from '../util/auth';
import { BrowserRouter } from 'react-router-dom';

const tableData = [{
        "scientific_poc": "Random Sample",
        "request_status": "active",
        "total-usage": 10,
        "account_id": "9032657199",
        "strides-credits": 250,
        "soft-limit": 0,
        "hard-limit": 0,
        "direct_pay_limit": 0,
        "workspace_type": "STRIDES Credits",
        "ecs": true,
        "subnet": 23,
        "root_account_email": "root_A2aaIH1d-e54I-AoeS-92DE-b93Be7e8A79B@planx-pla.net",
        "user_id": "sample@uchicago.edu",
        "bmh_workspace_id": "A2aaIH1d-e54I-AoeS-92DE-b93Be7e8A79B"
    },
    {
        "scientific_poc": "Another Sample",
        "request_status": "failed",
        "total-usage": 0,
        "account_id": "354484406138",
        "strides-credits": 250,
        "ecs": false,
        "subnet": 13,
        "workspace_type": "STRIDES Credits",
        "root_account_email": "root_a1s2dfdg-3I8S-2354-9og3-I422E4R8AW2a@planx-pla.net",
        "user_id": "another_sample@uchicago.edu",
        "bmh_workspace_id": "a1s2dfdg-3I8S-2354-9og3-I422E4R8AW2a",
    },
    {
        "scientific_poc": "Direct Pay Sample",
        "request_status": "Active",
        "total-usage": 0,
        "soft-limit": 60,
        "hard-limit": 80,
        "direct_pay_limit": 100,
        "account_id": "454484406131",
        "strides-credits": 0,
        "ecs": false,
        "subnet": 15,
        "workspace_type": "Direct Pay",
        "root_account_email": "root_123456-3I8S-2354-9og3-I422E4R8AW2a@planx-pla.net",
        "user_id": "direct_pay_sample@uchicago.edu",
        "bmh_workspace_id": "123456-3I8S-2354-9og3-I422E4R8AW2a",
    }
];
const formattedData = {
    "scientific_poc": "Another Sample",
    "user_id": "another_sample@uchicago.edu",
    "request_status": "Failed",
    "workspace_type": "STRIDES Credits",
    "total-usage": "$0",
    "direct_pay_limit": "",
    "soft-limit": "",
    "hard-limit": "",
    "ecs": "false",
    "subnet": "13",
    "strides-credits": "$250",
    "root_account_email": "root_a1s2dfdg-3I8S-2354-9og3-I422E4R8AW2a@planx-pla.net",
    "account_id": "354484406138"
}

const columns = [{
    dataField: 'user_id',
    text: 'User Id',
    editable: false
  },{
    dataField: 'account_id',
    text: 'AWS Account',
    editable: true,

  },{
    dataField: 'request_status',
    text: 'Request Status',
    editable: false,
  },{
    dataField: 'workspace_type',
    text: 'Workspace Type',
    editable: false
  },{
    dataField: 'total-usage',
    text: 'Total Usage',
    editable: false,
  },{
    dataField: 'soft-limit',
    text: 'Soft Limit',
    editable: false,
  },{
    dataField: 'hard-limit',
    text: 'Hard Limit',
    editable: false,
  },{
    dataField: 'strides-credits',
    text: 'Total Funds',
    editable: false,
  },{
    dataField: 'root_account_email',
    text: 'Root Email',
    editable: false,
  },{
    dataField: 'ecs',
    text: 'ECS',
    editable: false
  },{
    dataField: 'subnet',
    text: 'Subnet',
    editable: false,
  },{
    dataField: 'scientific_poc',
    text: 'Scientific POC',
    editable: false
  }]

const NUMBER_OF_COLUMNS = 12
process.env.REACT_APP_OIDC_AUTH_URI = "https://fence.planx-pla.net/user/oauth2/authorize"

const mountAccountsWrapper = (tableData, isAdmin = true) => {
    jest.spyOn(apiUtils, 'getAdminWorkspaces').mockImplementation((callback) => {callback(tableData) });
    jest.spyOn(authUtils, 'authorizeAdmin').mockResolvedValue(isAdmin);
    return mount(
        <BrowserRouter>
            <WorkspaceAccountsAdmin />
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
    await waitFor(() => {});
    expect(rows).toHaveLength(tableData.length);
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

jest.useFakeTimers()
it('verifies the approveWorkspace is called upon save correctly', async () => {
    const mockFunction = jest.spyOn(apiUtils, 'approveWorkspace');
    mockFunction.mockImplementation(()=>{})
    global.confirm = () => true
    const workspaceAccountsWrapper = mountAccountsWrapper(tableData);
    const table = workspaceAccountsWrapper.find('BootstrapTable');
    const rows = table.find('SimpleRow');
    const firstRowCells = rows.first().find('Cell');

    await waitFor(() => {
        columns.filter((eachColumn)=> eachColumn['editable']).forEach((eachColumn) => {
            const cell = firstRowCells.find({ "column": eachColumn });
            let { row, column } = cell.props();
            let beforeSaveCall = table.prop('cellEdit').options.beforeSaveCell;
            let { oldValue, newValue } = { oldValue: row['account_id'], newValue: 3523486501941 };
            beforeSaveCall(oldValue, newValue, row, column, ()=>{});
            jest.runAllTimers();
            expect(mockFunction).toHaveBeenCalledWith(row['bmh_workspace_id'],{'account_id': newValue});
        });
    });
});
