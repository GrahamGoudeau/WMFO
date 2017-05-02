import * as React from "react";

export interface ShowFormProps { compiler: string; framework: string; }
{/*import {Link} from "react-router";*/}
//export interface DJNameFormProps {name: string;}
//export interface ShowNameFormProps {name: string;}



export class ShowForm extends React.Component<ShowFormProps, any> 
{
    render (){
        return (
                <div id="show_form">
                    <DJNameForm/>
                    <ShowNameForm/>
                </div>
            )
    }
}

class DJNameForm extends React.Component<any, any> 
{
  constructor(props: any) {
    super(props);
    this.state = {name: "DJ"};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public handleChange(event:any) : void {
    this.setState({name: event.target.value});
  }

  public handleSubmit(event:any) : void {
    alert('A name was submitted: ' + this.state.name);
    event.preventDefault();
  }

  public render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          DJ Name:
          <br/>
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}


class ShowNameForm extends React.Component<any, any> 
{
  constructor(props: any) {
    super(props);
    this.state = {name: "show" };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  public handleChange(event:any) : void {
    this.setState({name: event.target.value});
  }

  public handleSubmit(event:any) : void {
    alert('A show name was submitted: ' + this.state.name);
    event.preventDefault();
  }

  public render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Show Name:
          <br/>
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

